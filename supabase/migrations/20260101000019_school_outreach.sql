-- Where each school stands in the introduction campaign (messages sent by WhatsApp or email). Administrators only.
-- A school without a row has not been contacted.
create table public.school_outreach (
  school_id uuid primary key references public.schools (id) on delete cascade,
  status text not null default 'sent' check (status in ('sent', 'replied', 'confirmed', 'declined')),
  channel text check (channel in ('whatsapp', 'email', 'both')),
  contacted_at timestamptz,
  note text check (char_length(note) <= 500),
  updated_by uuid references public.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.school_outreach enable row level security;
create policy school_outreach_admin_all on public.school_outreach for all using (public.is_admin()) with check (public.is_admin());

create trigger school_outreach_touch before update on public.school_outreach
  for each row execute function public.touch_updated_at();
create trigger school_outreach_audit after update or delete on public.school_outreach
  for each row execute function public.log_audit();
