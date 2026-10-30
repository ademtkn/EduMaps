-- Contact form: messages from visitors to the Line.kg team, plus the consent record kept on user accounts.
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  email text not null check (char_length(email) between 5 and 254 and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  topic text not null check (topic in ('support', 'add_school', 'correction', 'advertising', 'privacy', 'other')),
  school text check (school is null or char_length(school) <= 200),
  message text not null check (char_length(message) between 10 and 4000),
  lang text not null default 'en' check (lang in ('kg', 'ru', 'en')),
  user_id uuid references public.users (id) on delete set null,
  status text not null default 'new' check (status in ('new', 'read', 'resolved')),
  admin_note text check (admin_note is null or char_length(admin_note) <= 2000),
  handled_by uuid references public.users (id) on delete set null,
  handled_at timestamptz,
  created_at timestamptz not null default now()
);
create index contact_messages_status_created_idx on public.contact_messages (status, created_at desc);
create index contact_messages_email_idx on public.contact_messages (lower(email), created_at desc);

alter table public.contact_messages enable row level security;
-- No insert policy on purpose: visitors can only write through submit_contact_message(), which enforces the limits.
create policy contact_messages_admin_read on public.contact_messages for select using (public.is_admin());
create policy contact_messages_admin_update on public.contact_messages for update using (public.is_admin()) with check (public.is_admin());
create policy contact_messages_admin_delete on public.contact_messages for delete using (public.is_admin());

create trigger contact_messages_audit after update or delete on public.contact_messages for each row execute function public.log_audit();

create or replace function public.contact_messages_stamp()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status then
    new.handled_by := auth.uid();
    new.handled_at := now();
  end if;
  return new;
end;
$$;
create trigger contact_messages_stamp before update on public.contact_messages for each row execute function public.contact_messages_stamp();

create or replace function public.submit_contact_message(
  p_name text, p_email text, p_topic text, p_school text, p_message text, p_lang text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_message text := btrim(coalesce(p_message, ''));
begin
  if public.looks_like_spam(v_message || ' ' || coalesce(p_school, '')) then
    raise exception 'spam_detected' using errcode = 'P0001';
  end if;
  if (select count(*) from public.contact_messages where lower(email) = v_email and created_at > now() - interval '24 hours') >= 3 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.contact_messages
    where lower(email) = v_email and message = v_message and created_at > now() - interval '7 days'
  ) then
    raise exception 'duplicate_content' using errcode = 'P0001';
  end if;

  insert into public.contact_messages (name, email, topic, school, message, lang, user_id)
  values (btrim(p_name), v_email, p_topic, nullif(btrim(coalesce(p_school, '')), ''), v_message, coalesce(p_lang, 'en'), auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.submit_contact_message(text, text, text, text, text, text) from public;
grant execute on function public.submit_contact_message(text, text, text, text, text, text) to anon, authenticated;
