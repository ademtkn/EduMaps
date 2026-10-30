-- Visitors report wrong information; school representatives claim their profile and propose changes.
-- Nothing a visitor or representative sends is published directly: administrators review every request.

-- ---------------------------------------------------------------------------
-- Correction requests (anyone, signed in or not)
-- ---------------------------------------------------------------------------
create table public.correction_requests (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  topic text not null check (topic in ('contact', 'address', 'fees', 'hours', 'programs', 'closed', 'other')),
  message text not null check (char_length(message) between 10 and 2000),
  source_url text check (source_url is null or char_length(source_url) <= 300),
  reporter_name text check (reporter_name is null or char_length(reporter_name) <= 80),
  reporter_email text check (reporter_email is null or (char_length(reporter_email) <= 254 and reporter_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')),
  user_id uuid references public.users (id) on delete set null,
  lang text not null default 'en' check (lang in ('kg', 'ru', 'en')),
  status text not null default 'new' check (status in ('new', 'reviewing', 'applied', 'rejected')),
  admin_note text check (admin_note is null or char_length(admin_note) <= 1000),
  handled_by uuid references public.users (id) on delete set null,
  handled_at timestamptz,
  created_at timestamptz not null default now()
);
create index correction_requests_status_idx on public.correction_requests (status, created_at desc);
create index correction_requests_school_idx on public.correction_requests (school_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Claims: a signed-in member says they represent a school
-- ---------------------------------------------------------------------------
create table public.school_claims (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  position_title text not null check (char_length(position_title) between 2 and 80),
  phone text check (phone is null or char_length(phone) <= 40),
  work_email text check (work_email is null or (char_length(work_email) <= 254 and work_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')),
  message text not null check (char_length(message) between 10 and 1500),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'revoked')),
  admin_note text check (admin_note is null or char_length(admin_note) <= 1000),
  reviewed_by uuid references public.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint school_claims_contact check (phone is not null or work_email is not null)
);
create unique index school_claims_one_open on public.school_claims (school_id, user_id) where status in ('pending', 'approved');
create index school_claims_status_idx on public.school_claims (status, created_at desc);

alter table public.schools add column claimed boolean not null default false;

-- ---------------------------------------------------------------------------
-- Proposed profile changes from an approved representative
-- ---------------------------------------------------------------------------
create table public.school_update_requests (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  changes jsonb not null check (jsonb_typeof(changes) = 'object' and pg_column_size(changes) < 60000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text check (admin_note is null or char_length(admin_note) <= 1000),
  reviewed_by uuid references public.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index school_update_requests_status_idx on public.school_update_requests (status, created_at desc);

-- ---------------------------------------------------------------------------
-- Row level security: requests are written only through the functions below, read by their author and by admins
-- ---------------------------------------------------------------------------
alter table public.correction_requests enable row level security;
alter table public.school_claims enable row level security;
alter table public.school_update_requests enable row level security;

create policy correction_requests_admin_read on public.correction_requests for select using (public.is_admin());
create policy correction_requests_own_read on public.correction_requests for select using (user_id = auth.uid());
create policy correction_requests_admin_update on public.correction_requests for update using (public.is_admin()) with check (public.is_admin());
create policy correction_requests_admin_delete on public.correction_requests for delete using (public.is_admin());

create policy school_claims_read on public.school_claims for select using (user_id = auth.uid() or public.is_admin());
create policy school_claims_admin_update on public.school_claims for update using (public.is_admin()) with check (public.is_admin());
create policy school_claims_admin_delete on public.school_claims for delete using (public.is_admin());

create policy school_update_requests_read on public.school_update_requests for select using (user_id = auth.uid() or public.is_admin());
create policy school_update_requests_admin_update on public.school_update_requests for update using (public.is_admin()) with check (public.is_admin());
create policy school_update_requests_admin_delete on public.school_update_requests for delete using (public.is_admin());

create trigger correction_requests_audit after update or delete on public.correction_requests for each row execute function public.log_audit();
create trigger school_claims_audit after update or delete on public.school_claims for each row execute function public.log_audit();
create trigger school_update_requests_audit after update or delete on public.school_update_requests for each row execute function public.log_audit();

-- Stamp who reviewed a request.
create or replace function public.stamp_review()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    if tg_table_name = 'correction_requests' then
      new.handled_by := auth.uid();
      new.handled_at := now();
    else
      new.reviewed_by := auth.uid();
      new.reviewed_at := now();
    end if;
  end if;
  return new;
end; $$;
create trigger correction_requests_stamp before update on public.correction_requests for each row execute function public.stamp_review();
create trigger school_claims_stamp before update on public.school_claims for each row execute function public.stamp_review();
create trigger school_update_requests_stamp before update on public.school_update_requests for each row execute function public.stamp_review();

-- schools.claimed follows the claims table.
create or replace function public.sync_school_claimed()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_school uuid := coalesce(new.school_id, old.school_id);
begin
  perform set_config('app.system_write', '1', true);
  update public.schools set claimed = exists (select 1 from public.school_claims c where c.school_id = v_school and c.status = 'approved') where id = v_school;
  return coalesce(new, old);
end; $$;
create trigger school_claims_sync after insert or update of status or delete on public.school_claims for each row execute function public.sync_school_claimed();

-- ---------------------------------------------------------------------------
-- Who may manage a school
-- ---------------------------------------------------------------------------
create or replace function public.is_school_manager(p_school uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.school_claims c join public.users u on u.id = c.user_id
    where c.school_id = p_school and c.user_id = auth.uid() and c.status = 'approved' and not u.is_banned
  );
$$;

-- ---------------------------------------------------------------------------
-- Submission functions (limits enforced here, so the API cannot be used to bypass them)
-- ---------------------------------------------------------------------------
create or replace function public.submit_correction_request(
  p_school uuid, p_topic text, p_message text, p_source text, p_name text, p_email text, p_lang text
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_email text := nullif(lower(btrim(coalesce(p_email, ''))), '');
  v_message text := btrim(coalesce(p_message, ''));
begin
  if not exists (select 1 from public.schools where id = p_school and status = 'published') then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  if public.looks_like_spam(v_message || ' ' || coalesce(p_source, '')) then
    raise exception 'spam_detected' using errcode = 'P0001';
  end if;
  if auth.uid() is not null and (select count(*) from public.correction_requests where user_id = auth.uid() and created_at > now() - interval '24 hours') >= 5 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  if v_email is not null and (select count(*) from public.correction_requests where lower(reporter_email) = v_email and created_at > now() - interval '24 hours') >= 5 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  if (select count(*) from public.correction_requests where school_id = p_school and created_at > now() - interval '24 hours') >= 25 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.correction_requests where school_id = p_school and message = v_message and created_at > now() - interval '7 days') then
    raise exception 'duplicate_content' using errcode = 'P0001';
  end if;

  insert into public.correction_requests (school_id, topic, message, source_url, reporter_name, reporter_email, user_id, lang)
  values (p_school, p_topic, v_message, nullif(btrim(coalesce(p_source, '')), ''), nullif(btrim(coalesce(p_name, '')), ''), v_email, auth.uid(), coalesce(p_lang, 'en'))
  returning id into v_id;
  return v_id;
end; $$;

create or replace function public.submit_school_claim(
  p_school uuid, p_position text, p_phone text, p_work_email text, p_message text
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_message text := btrim(coalesce(p_message, ''));
begin
  if auth.uid() is null then raise exception 'unauthenticated' using errcode = '42501'; end if;
  if not public.is_active_user() then raise exception 'banned' using errcode = '42501'; end if;
  if not exists (select 1 from public.schools where id = p_school and status = 'published') then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  if public.looks_like_spam(v_message) then raise exception 'spam_detected' using errcode = 'P0001'; end if;
  if (select count(*) from public.school_claims where user_id = auth.uid() and status = 'pending') >= 3 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  insert into public.school_claims (school_id, user_id, position_title, phone, work_email, message)
  values (p_school, auth.uid(), btrim(p_position), nullif(btrim(coalesce(p_phone, '')), ''), nullif(lower(btrim(coalesce(p_work_email, ''))), ''), v_message)
  returning id into v_id;
  return v_id;
end; $$;

create or replace function public.submit_school_update(p_school uuid, p_changes jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'unauthenticated' using errcode = '42501'; end if;
  if not public.is_school_manager(p_school) then raise exception 'forbidden' using errcode = '42501'; end if;
  if (select count(*) from public.school_update_requests where school_id = p_school and status = 'pending') >= 3 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  insert into public.school_update_requests (school_id, user_id, changes) values (p_school, auth.uid(), p_changes) returning id into v_id;
  return v_id;
end; $$;

revoke all on function public.submit_correction_request(uuid, text, text, text, text, text, text) from public;
revoke all on function public.submit_school_claim(uuid, text, text, text, text) from public, anon;
revoke all on function public.submit_school_update(uuid, jsonb) from public, anon;
revoke all on function public.is_school_manager(uuid) from public;
grant execute on function public.submit_correction_request(uuid, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.submit_school_claim(uuid, text, text, text, text) to authenticated;
grant execute on function public.submit_school_update(uuid, jsonb) to authenticated;
grant execute on function public.is_school_manager(uuid) to authenticated;

-- Account deletion also removes what the member sent to us.
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public, auth as $$
declare
  v_id uuid := auth.uid();
  v_role text;
begin
  if v_id is null then raise exception 'unauthenticated' using errcode = '42501'; end if;
  select role into v_role from public.users where id = v_id;
  if v_role in ('admin', 'moderator') then raise exception 'staff_cannot_self_delete' using errcode = '42501'; end if;
  perform set_config('app.system_write', '1', true);
  delete from public.correction_requests where user_id = v_id;
  delete from public.contact_messages where user_id = v_id;
  delete from auth.users where id = v_id;
end; $$;
