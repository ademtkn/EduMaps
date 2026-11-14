-- Usernames and social sign-in.
--  * profiles.username: the public handle. Members can sign in with it instead of their email.
--  * handle_new_user now also copes with Google / Apple sign-ups (no display_name in the metadata).
--  * email_for_username: used by the server to turn a username into the email Supabase Auth signs in with.
--    It returns an email address, so only the service role may call it.

alter table public.profiles add column username text;

-- Free handle for a wanted name: lowercase letters, digits, "_" and "."; 3 to 30 characters; a number is appended on clashes.
create or replace function public.generate_username(p_base text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_base text;
  v_name text;
  v_try int := 0;
begin
  v_base := regexp_replace(lower(coalesce(p_base, '')), '[^a-z0-9_.]', '', 'g');
  v_base := regexp_replace(v_base, '^[^a-z0-9]+', '');
  v_base := left(v_base, 24);
  if char_length(v_base) < 3 then
    v_base := rpad(v_base, 3, '0');
    if v_base = '000' then v_base := 'member'; end if;
  end if;
  v_name := v_base;
  while exists (select 1 from public.profiles where username = v_name) loop
    v_try := v_try + 1;
    v_name := v_base || (floor(random() * 9000) + 1000)::int::text;
    exit when v_try > 50;
  end loop;
  return v_name;
end;
$$;
revoke all on function public.generate_username(text) from public, anon, authenticated;

-- Existing members get a handle derived from their email.
do $$
declare
  r record;
begin
  for r in
    select p.user_id, u.email from public.profiles p join public.users u on u.id = p.user_id where p.username is null order by p.created_at
  loop
    update public.profiles set username = public.generate_username(split_part(r.email, '@', 1)) where user_id = r.user_id;
  end loop;
end $$;

alter table public.profiles alter column username set not null;
alter table public.profiles add constraint profiles_username_format check (username ~ '^[a-z0-9][a-z0-9_.]{2,29}$');
create unique index profiles_username_key on public.profiles (username);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_name text;
  v_user text;
  v_lang text;
begin
  -- Email sign-up sends display_name + username; Google / Apple send full_name / name (Apple often nothing at all).
  -- Only the given name is taken from a provider profile, so a full real name is not published by default.
  v_name := left(
    coalesce(
      nullif(btrim(v_meta ->> 'display_name'), ''),
      nullif(split_part(btrim(coalesce(v_meta ->> 'full_name', v_meta ->> 'name', '')), ' ', 1), ''),
      split_part(new.email, '@', 1)
    ), 60);
  if char_length(v_name) < 2 then
    v_name := rpad(v_name, 2, '_');
  end if;

  -- The wanted username is used when it is valid and free; otherwise a free one is generated.
  v_user := lower(btrim(coalesce(v_meta ->> 'username', '')));
  if v_user !~ '^[a-z0-9][a-z0-9_.]{2,29}$' or exists (select 1 from public.profiles where username = v_user) then
    v_user := public.generate_username(coalesce(nullif(v_meta ->> 'username', ''), split_part(new.email, '@', 1), v_name));
  end if;

  v_lang := coalesce(v_meta ->> 'preferred_lang', 'kg');
  if v_lang not in ('kg', 'ru', 'en') then
    v_lang := 'kg';
  end if;

  insert into public.users (id, email) values (new.id, coalesce(new.email, ''));
  insert into public.profiles (user_id, display_name, username, preferred_lang) values (new.id, v_name, v_user, v_lang);
  return new;
end;
$$;

-- Registration form: is this handle still free? Handles are public, so this reveals nothing private.
create or replace function public.username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (select 1 from public.profiles where username = lower(btrim(p_username)));
$$;
revoke all on function public.username_available(text) from public;
grant execute on function public.username_available(text) to anon, authenticated, service_role;

-- Sign-in by username: server only (service role), never reachable from the browser.
create or replace function public.email_for_username(p_username text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.email from public.profiles p join public.users u on u.id = p.user_id
  where p.username = lower(btrim(p_username)) and u.email <> '';
$$;
revoke all on function public.email_for_username(text) from public, anon, authenticated;
grant execute on function public.email_for_username(text) to service_role;
