-- One row per school with the fields that are usually missing, so the admin console can show
-- "619 profiles have no photo" and filter the list instead of opening every school by hand.
--
-- `security_invoker = on` keeps row level security of the underlying tables in force: only published
-- schools are visible to a non-staff session, drafts stay with the staff. The view is for the admin
-- console, so visitors cannot read it at all.

drop view if exists public.admin_school_completeness;

create or replace view public.admin_school_completeness
with (security_invoker = on) as
select
  s.id,
  s.slug,
  s.name,
  s.search_text,
  s.status,
  s.data_status,
  s.school_type,
  s.institution_kind,
  s.updated_at,
  s.rating_avg,
  s.rating_count,
  s.view_count,
  c.name as city_name,
  (s.cover_url is not null) as has_cover,
  (s.logo_url is not null) as has_logo,
  (l.lat is not null and l.lng is not null) as has_location,
  (l.address is not null and coalesce(
     nullif(btrim(l.address ->> 'en'), ''),
     nullif(btrim(l.address ->> 'ru'), ''),
     nullif(btrim(l.address ->> 'kg'), '')
   ) is not null) as has_address,
  (s.fee_min is not null or s.fee_max is not null) as has_fee,
  (s.phone is not null or s.email is not null or s.website is not null) as has_contact,
  (select count(*) from public.school_media m where m.school_id = s.id) as media_count,
  (select count(*) from public.school_programs p where p.school_id = s.id) as program_count
from public.schools s
left join public.school_locations l on l.school_id = s.id
left join public.cities c on c.id = s.city_id;

revoke all on public.admin_school_completeness from anon;
grant select on public.admin_school_completeness to authenticated, service_role;
