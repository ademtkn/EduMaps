-- 1. A sponsored card that can appear among the schools on the home page.
alter type public.ad_placement add value if not exists 'home_grid';

-- 2. What people say about EduMaps.kg: opinions from members (moderated) and invited guests (added by an administrator).
create or replace function public.i18n_max_len(value jsonb, max_len integer)
returns boolean language sql immutable as $$
  select coalesce((select max(char_length(v)) from jsonb_each_text(value) as t(k, v)), 0) <= max_len;
$$;

create table public.site_testimonials (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('member', 'invited')),
  user_id uuid references public.users (id) on delete cascade,
  author_name text not null check (char_length(author_name) between 2 and 80),
  author_title text check (author_title is null or char_length(author_title) <= 100),
  quote jsonb not null check (public.is_i18n(quote) and public.i18n_max_len(quote, 400) and quote <> '{}'::jsonb),
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  is_demo boolean not null default false,
  consent_note text check (consent_note is null or char_length(consent_note) <= 300),
  admin_note text check (admin_note is null or char_length(admin_note) <= 1000),
  reviewed_by uuid references public.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_testimonials_member_has_user check (kind <> 'member' or user_id is not null),
  constraint site_testimonials_invited_has_consent check (kind <> 'invited' or char_length(coalesce(consent_note, '')) >= 5)
);
create unique index site_testimonials_one_per_member on public.site_testimonials (user_id) where user_id is not null;
create index site_testimonials_status_idx on public.site_testimonials (status, created_at desc);

alter table public.site_testimonials enable row level security;
create policy site_testimonials_own_read on public.site_testimonials for select using (user_id = auth.uid());
create policy site_testimonials_own_delete on public.site_testimonials for delete using (user_id = auth.uid());
create policy site_testimonials_admin_all on public.site_testimonials for all using (public.is_admin()) with check (public.is_admin());

-- What visitors may read: published opinions only, without the account id or internal notes.
create view public.public_testimonials as
  select id, kind, author_name, author_title, quote, is_demo, created_at
  from public.site_testimonials where status = 'published';
grant select on public.public_testimonials to anon, authenticated;

create trigger site_testimonials_stamp before update on public.site_testimonials for each row execute function public.stamp_review();
create trigger site_testimonials_touch before update on public.site_testimonials for each row execute function public.touch_updated_at();
create trigger site_testimonials_audit after update or delete on public.site_testimonials for each row execute function public.log_audit();

-- A signed-in member sends (or replaces) their opinion. It is always held for review.
create or replace function public.submit_site_testimonial(p_quote text, p_lang text, p_title text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_quote text := btrim(coalesce(p_quote, ''));
  v_name text;
begin
  if auth.uid() is null then raise exception 'unauthenticated' using errcode = '42501'; end if;
  if not public.is_active_user() then raise exception 'banned' using errcode = '42501'; end if;
  if p_lang is null or p_lang not in ('kg', 'ru', 'en') then raise exception 'invalid' using errcode = 'P0001'; end if;
  if char_length(v_quote) < 20 or char_length(v_quote) > 400 then raise exception 'invalid' using errcode = 'P0001'; end if;
  if public.looks_like_spam(v_quote) then raise exception 'spam_detected' using errcode = 'P0001'; end if;
  select display_name into v_name from public.profiles where user_id = auth.uid();
  if v_name is null then raise exception 'invalid' using errcode = 'P0001'; end if;

  insert into public.site_testimonials (kind, user_id, author_name, author_title, quote)
  values ('member', auth.uid(), v_name, nullif(btrim(coalesce(p_title, '')), ''), jsonb_build_object(p_lang, v_quote))
  on conflict (user_id) where user_id is not null do update
    set quote = excluded.quote, author_name = excluded.author_name, author_title = excluded.author_title,
        status = 'pending', reviewed_by = null, reviewed_at = null, admin_note = null
  returning id into v_id;
  return v_id;
end; $$;
revoke all on function public.submit_site_testimonial(text, text, text) from public, anon;
grant execute on function public.submit_site_testimonial(text, text, text) to authenticated;
