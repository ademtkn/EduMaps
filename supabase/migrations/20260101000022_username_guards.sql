-- Finish username constraints for existing installations and the social-only account capability check.
-- A transaction lock serializes name selection with profile renames, so concurrent sign-ups never
-- silently receive a different requested handle. The unique index remains the final constraint.

create or replace function public.username_reserved(p_username text)
returns boolean language sql immutable set search_path = '' as $$
  select lower(btrim(coalesce(p_username, ''))) = any(array[
    'admin', 'administrator', 'moderator', 'support', 'help', 'staff', 'team', 'official', 'root', 'system',
    'edumaps', 'edumap', 'edumaps.kg', 'line', 'linekg', 'null', 'undefined'
  ]);
$$;
revoke all on function public.username_reserved(text) from public, anon, authenticated;

create or replace function public.generate_username(p_base text)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_base text;
  v_name text;
  v_suffix text;
  v_try bigint := 0;
begin
  perform pg_advisory_xact_lock(432673920191::bigint);
  v_base := left(regexp_replace(regexp_replace(lower(coalesce(p_base, '')), '[^a-z0-9_.]', '', 'g'), '^[^a-z0-9]+', ''), 24);
  if char_length(v_base) < 3 then
    v_base := rpad(v_base, 3, '0');
    if v_base = '000' then v_base := 'member'; end if;
  end if;
  v_name := v_base;
  while public.username_reserved(v_name) or exists (select 1 from public.profiles where username = v_name) loop
    v_try := v_try + 1;
    v_suffix := v_try::text;
    v_name := left(v_base, 30 - char_length(v_suffix)) || v_suffix;
  end loop;
  return v_name;
end;
$$;
revoke all on function public.generate_username(text) from public, anon, authenticated;

-- Migration 21 derived handles from email addresses, including e.g. the demo administrator.
-- Give those existing members a valid free variant; email sign-in is unchanged.
do $$
declare r record;
begin
  perform pg_advisory_xact_lock(432673920191::bigint);
  for r in select user_id, username from public.profiles where public.username_reserved(username) order by created_at loop
    update public.profiles set username = public.generate_username(r.username) where user_id = r.user_id;
  end loop;
end;
$$;

create or replace function public.guard_profile_username()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and new.username is not distinct from old.username then return new; end if;
  perform pg_advisory_xact_lock(432673920191::bigint);
  if new.username is null or new.username !~ '^[a-z0-9][a-z0-9_.]{2,29}$' then
    raise exception 'username_invalid' using errcode = '23514';
  end if;
  if public.username_reserved(new.username) then
    raise exception 'username_reserved' using errcode = '23514';
  end if;
  if exists (select 1 from public.profiles p where p.username = new.username and p.user_id <> new.user_id) then
    raise exception 'username_taken' using errcode = '23505', constraint = 'profiles_username_key';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_profile_username() from public, anon, authenticated;
drop trigger if exists profiles_username_guard on public.profiles;
create trigger profiles_username_guard before insert or update of username on public.profiles
  for each row execute function public.guard_profile_username();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_name text;
  v_user text;
  v_lang text;
begin
  perform pg_advisory_xact_lock(432673920191::bigint);
  v_name := left(coalesce(
    nullif(btrim(v_meta ->> 'display_name'), ''),
    nullif(split_part(btrim(coalesce(v_meta ->> 'full_name', v_meta ->> 'name', '')), ' ', 1), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''), 'Member'
  ), 60);
  if char_length(v_name) < 2 then v_name := rpad(v_name, 2, '_'); end if;
  v_user := lower(btrim(coalesce(v_meta ->> 'username', '')));
  if v_user = '' then
    v_user := public.generate_username(coalesce(nullif(split_part(new.email, '@', 1), ''), v_name));
  elsif v_user !~ '^[a-z0-9][a-z0-9_.]{2,29}$' then
    raise exception 'username_invalid' using errcode = '23514';
  elsif public.username_reserved(v_user) then
    raise exception 'username_reserved' using errcode = '23514';
  elsif exists (select 1 from public.profiles where username = v_user) then
    raise exception 'username_taken' using errcode = '23505', constraint = 'profiles_username_key';
  end if;

  v_lang := coalesce(v_meta ->> 'preferred_lang', 'kg');
  if v_lang not in ('kg', 'ru', 'en') then v_lang := 'kg'; end if;
  insert into public.users (id, email) values (new.id, coalesce(new.email, ''));
  insert into public.profiles (user_id, display_name, username, preferred_lang) values (new.id, v_name, v_user, v_lang);
  return new;
end;
$$;

create or replace function public.username_available(p_username text)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    lower(btrim(p_username)) ~ '^[a-z0-9][a-z0-9_.]{2,29}$'
    and not public.username_reserved(p_username)
    and not exists (select 1 from public.profiles where username = lower(btrim(p_username))), false);
$$;
revoke all on function public.username_available(text) from public;
grant execute on function public.username_available(text) to anon, authenticated, service_role;

-- Only a yes/no capability for the authenticated caller; passwords and other users are never exposed.
create or replace function public.user_has_password()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(u.encrypted_password, '') <> '' from auth.users u where u.id = auth.uid();
$$;
revoke all on function public.user_has_password() from public, anon;
grant execute on function public.user_has_password() to authenticated;

-- Social-only deletion needs recent provider authentication even when called directly through RPC.
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public, auth as $$
declare
  v_id uuid := auth.uid();
  v_role text;
  v_now numeric := extract(epoch from now());
begin
  if v_id is null then raise exception 'unauthenticated' using errcode = '42501'; end if;
  select role into v_role from public.users where id = v_id;
  if v_role in ('admin', 'moderator') then raise exception 'staff_cannot_self_delete' using errcode = '42501'; end if;
  if not coalesce(public.user_has_password(), false) and not exists (
    select 1 from jsonb_array_elements(
      case when jsonb_typeof(auth.jwt() -> 'amr') = 'array' then auth.jwt() -> 'amr' else '[]'::jsonb end
    ) a
    where a ->> 'method' = 'oauth'
      and jsonb_typeof(a -> 'timestamp') = 'number'
      and case when jsonb_typeof(a -> 'timestamp') = 'number'
        then (a ->> 'timestamp')::numeric between v_now - 600 and v_now else false end
  ) then
    raise exception 'oauth_reauthentication_required' using errcode = '42501';
  end if;
  perform set_config('app.system_write', '1', true);
  delete from public.correction_requests where user_id = v_id;
  delete from public.contact_messages where user_id = v_id;
  delete from auth.users where id = v_id;
end;
$$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
