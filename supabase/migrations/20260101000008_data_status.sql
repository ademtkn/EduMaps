-- How trustworthy a school profile's facts are: fictional sample, listed but unconfirmed, or confirmed with the school.
alter table public.schools
  add column data_status text not null default 'verified' check (data_status in ('demo', 'unverified', 'verified'));
create index schools_data_status_idx on public.schools (data_status);
