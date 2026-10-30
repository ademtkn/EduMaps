-- 1. A school can be listed by address alone: coordinates are optional (both or neither).
alter table public.school_locations alter column lat drop not null, alter column lng drop not null;
alter table public.school_locations add constraint school_locations_coords_pair check ((lat is null) = (lng is null));

-- 2. Listing plan (administrators only): Free = 2 gallery photos and 1 video, Pro = 10 photos and 5 videos.
--    Kept in its own table so that it is never part of the public school record.
create table public.school_plans (
  school_id uuid primary key references public.schools (id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  updated_at timestamptz not null default now()
);
alter table public.school_plans enable row level security;
create policy school_plans_admin on public.school_plans for all using (public.is_admin()) with check (public.is_admin());
grant select, insert, update, delete on public.school_plans to authenticated;
create trigger school_plans_audit after insert or update or delete on public.school_plans for each row execute function public.log_audit();

-- Schools that already show more than the Free allowance keep it: they start on Pro.
insert into public.school_plans (school_id, plan)
select s.id, 'pro' from public.schools s
where (select count(*) from public.school_media m where m.school_id = s.id and m.kind = 'image') > 2
   or (select count(*) from public.school_media m where m.school_id = s.id and m.kind = 'video') > 1;

create or replace function public.admin_save_school(p jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid := nullif(p ->> 'id', '')::uuid;
  v_loc jsonb := p -> 'location';
  v_plan text := case when p ->> 'plan' = 'pro' then 'pro' else 'free' end;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  -- Free listings may show 2 gallery photos and 1 video, Pro listings 10 and 5. The administrator sets the plan.
  if (select count(*) from jsonb_array_elements(coalesce(p -> 'media', '[]'::jsonb)) m where m ->> 'kind' = 'image') > (case when v_plan = 'pro' then 10 else 2 end) then
    raise exception 'photo_limit' using errcode = 'P0001';
  end if;
  if (select count(*) from jsonb_array_elements(coalesce(p -> 'media', '[]'::jsonb)) m where m ->> 'kind' = 'video') > (case when v_plan = 'pro' then 5 else 1 end) then
    raise exception 'video_limit' using errcode = 'P0001';
  end if;

  if v_id is null then
    insert into public.schools (
      slug, name, tagline, about, city_id, school_type, education_systems, grade_from, grade_to,
      founded_year, student_count, teacher_count, avg_class_size, fee_min, fee_max, fee_period, fee_billing_months, tuition_notes,
      opening_time, closing_time, working_days, schedule_notes, has_scholarships, scholarships, has_transportation, transportation_info, has_boarding, boarding_info,
      phone, email, website, whatsapp, social, logo_url, cover_url, status, is_featured
    ) values (
      p ->> 'slug', p -> 'name',
      case when jsonb_typeof(p -> 'tagline') = 'object' then p -> 'tagline' end,
      case when jsonb_typeof(p -> 'about') = 'object' then p -> 'about' end,
      (p ->> 'city_id')::uuid, (p ->> 'school_type')::public.school_type,
      coalesce(array(select jsonb_array_elements_text(coalesce(p -> 'education_systems', '[]'::jsonb))), '{}'),
      coalesce(nullif(p ->> 'grade_from', '')::smallint, 1), coalesce(nullif(p ->> 'grade_to', '')::smallint, 11),
      nullif(p ->> 'founded_year', '')::smallint, nullif(p ->> 'student_count', '')::integer,
      nullif(p ->> 'teacher_count', '')::integer, nullif(p ->> 'avg_class_size', '')::smallint,
      nullif(p ->> 'fee_min', '')::integer, nullif(p ->> 'fee_max', '')::integer,
      coalesce(nullif(p ->> 'fee_period', ''), 'month'), coalesce(nullif(p ->> 'fee_billing_months', '')::smallint, 9),
      case when jsonb_typeof(p -> 'tuition_notes') = 'object' then p -> 'tuition_notes' end,
      nullif(p ->> 'opening_time', '')::time, nullif(p ->> 'closing_time', '')::time,
      coalesce(array(select x::smallint from jsonb_array_elements_text(coalesce(p -> 'working_days', '[]'::jsonb)) as x), '{}'),
      case when jsonb_typeof(p -> 'schedule_notes') = 'object' then p -> 'schedule_notes' end,
      coalesce((p ->> 'has_scholarships')::boolean, false),
      case when jsonb_typeof(p -> 'scholarships') = 'object' then p -> 'scholarships' end,
      coalesce((p ->> 'has_transportation')::boolean, false),
      case when jsonb_typeof(p -> 'transportation_info') = 'object' then p -> 'transportation_info' end,
      coalesce((p ->> 'has_boarding')::boolean, false),
      case when jsonb_typeof(p -> 'boarding_info') = 'object' then p -> 'boarding_info' end,
      nullif(p ->> 'phone', ''), nullif(p ->> 'email', ''), nullif(p ->> 'website', ''), nullif(p ->> 'whatsapp', ''),
      coalesce(case when jsonb_typeof(p -> 'social') = 'object' then p -> 'social' end, '{}'::jsonb),
      nullif(p ->> 'logo_url', ''), nullif(p ->> 'cover_url', ''),
      coalesce((p ->> 'status')::public.publish_status, 'draft'),
      coalesce((p ->> 'is_featured')::boolean, false)
    ) returning id into v_id;
  else
    update public.schools set
      slug = p ->> 'slug',
      name = p -> 'name',
      tagline = case when jsonb_typeof(p -> 'tagline') = 'object' then p -> 'tagline' end,
      about = case when jsonb_typeof(p -> 'about') = 'object' then p -> 'about' end,
      city_id = (p ->> 'city_id')::uuid,
      school_type = (p ->> 'school_type')::public.school_type,
      education_systems = coalesce(array(select jsonb_array_elements_text(coalesce(p -> 'education_systems', '[]'::jsonb))), '{}'),
      grade_from = coalesce(nullif(p ->> 'grade_from', '')::smallint, 1),
      grade_to = coalesce(nullif(p ->> 'grade_to', '')::smallint, 11),
      founded_year = nullif(p ->> 'founded_year', '')::smallint,
      student_count = nullif(p ->> 'student_count', '')::integer,
      teacher_count = nullif(p ->> 'teacher_count', '')::integer,
      avg_class_size = nullif(p ->> 'avg_class_size', '')::smallint,
      fee_min = nullif(p ->> 'fee_min', '')::integer,
      fee_max = nullif(p ->> 'fee_max', '')::integer,
      fee_period = coalesce(nullif(p ->> 'fee_period', ''), 'month'),
      fee_billing_months = coalesce(nullif(p ->> 'fee_billing_months', '')::smallint, 9),
      tuition_notes = case when jsonb_typeof(p -> 'tuition_notes') = 'object' then p -> 'tuition_notes' end,
      opening_time = nullif(p ->> 'opening_time', '')::time,
      closing_time = nullif(p ->> 'closing_time', '')::time,
      working_days = coalesce(array(select x::smallint from jsonb_array_elements_text(coalesce(p -> 'working_days', '[]'::jsonb)) as x), '{}'),
      schedule_notes = case when jsonb_typeof(p -> 'schedule_notes') = 'object' then p -> 'schedule_notes' end,
      has_scholarships = coalesce((p ->> 'has_scholarships')::boolean, false),
      scholarships = case when jsonb_typeof(p -> 'scholarships') = 'object' then p -> 'scholarships' end,
      has_transportation = coalesce((p ->> 'has_transportation')::boolean, false),
      transportation_info = case when jsonb_typeof(p -> 'transportation_info') = 'object' then p -> 'transportation_info' end,
      has_boarding = coalesce((p ->> 'has_boarding')::boolean, false),
      boarding_info = case when jsonb_typeof(p -> 'boarding_info') = 'object' then p -> 'boarding_info' end,
      phone = nullif(p ->> 'phone', ''),
      email = nullif(p ->> 'email', ''),
      website = nullif(p ->> 'website', ''),
      whatsapp = nullif(p ->> 'whatsapp', ''),
      social = coalesce(case when jsonb_typeof(p -> 'social') = 'object' then p -> 'social' end, '{}'::jsonb),
      logo_url = nullif(p ->> 'logo_url', ''),
      cover_url = nullif(p ->> 'cover_url', ''),
      status = coalesce((p ->> 'status')::public.publish_status, 'draft'),
      is_featured = coalesce((p ->> 'is_featured')::boolean, false)
    where id = v_id;
    if not found then
      raise exception 'not_found' using errcode = 'P0002';
    end if;
  end if;

  if jsonb_typeof(v_loc) = 'object' then
    insert into public.school_locations (school_id, lat, lng, address, district)
    values (v_id, nullif(v_loc ->> 'lat', '')::numeric, nullif(v_loc ->> 'lng', '')::numeric, coalesce(v_loc -> 'address', '{}'::jsonb), nullif(v_loc ->> 'district', ''))
    on conflict (school_id) do update
      set lat = excluded.lat, lng = excluded.lng, address = excluded.address, district = excluded.district;
  else
    delete from public.school_locations where school_id = v_id;
  end if;

  delete from public.school_languages where school_id = v_id;
  insert into public.school_languages (school_id, language_code, is_primary)
  select v_id, x.code, coalesce(x.is_primary, false)
  from jsonb_to_recordset(coalesce(p -> 'languages', '[]'::jsonb)) as x(code text, is_primary boolean);

  delete from public.school_programs where school_id = v_id;
  insert into public.school_programs (school_id, kind, name, description, sort_order)
  select v_id, x.kind, x.name,
         case when jsonb_typeof(x.description) = 'object' then x.description end,
         coalesce(x.sort_order, (row_number() over ())::smallint)
  from jsonb_to_recordset(coalesce(p -> 'programs', '[]'::jsonb))
    as x(kind public.program_kind, name jsonb, description jsonb, sort_order smallint);

  delete from public.school_facilities where school_id = v_id;
  insert into public.school_facilities (school_id, facility_key, note)
  select v_id, x.facility_key, case when jsonb_typeof(x.note) = 'object' then x.note end
  from jsonb_to_recordset(coalesce(p -> 'facilities', '[]'::jsonb)) as x(facility_key text, note jsonb);

  delete from public.school_fee_items where school_id = v_id;
  insert into public.school_fee_items (school_id, item_key, included, extra_amount, extra_period)
  select v_id, x.item_key, x.included,
         case when x.included then null else x.extra_amount end,
         case when x.included then null else x.extra_period end
  from jsonb_to_recordset(coalesce(p -> 'fee_items', '[]'::jsonb)) as x(item_key text, included boolean, extra_amount integer, extra_period text);

  delete from public.school_media where school_id = v_id;
  insert into public.school_media (school_id, kind, url, storage_path, caption, sort_order)
  select v_id, x.kind, x.url, nullif(x.storage_path, ''),
         case when jsonb_typeof(x.caption) = 'object' then x.caption end,
         coalesce(x.sort_order, (row_number() over ())::smallint)
  from jsonb_to_recordset(coalesce(p -> 'media', '[]'::jsonb))
    as x(kind public.media_kind, url text, storage_path text, caption jsonb, sort_order smallint);

  insert into public.school_plans (school_id, plan) values (v_id, v_plan)
  on conflict (school_id) do update set plan = excluded.plan, updated_at = now();

  delete from public.school_documents where school_id = v_id;
  insert into public.school_documents (school_id, title, url, sort_order)
  select v_id, x.title, x.url, coalesce(x.sort_order, (row_number() over ())::smallint)
  from jsonb_to_recordset(coalesce(p -> 'documents', '[]'::jsonb)) as x(title text, url text, sort_order smallint);

  delete from public.school_faqs where school_id = v_id;
  insert into public.school_faqs (school_id, question, answer, sort_order)
  select v_id, x.question, x.answer, coalesce(x.sort_order, (row_number() over ())::smallint)
  from jsonb_to_recordset(coalesce(p -> 'faqs', '[]'::jsonb)) as x(question jsonb, answer jsonb, sort_order smallint);

  return v_id;
end;
$$;

revoke execute on function public.admin_save_school(jsonb) from public, anon;
grant execute on function public.admin_save_school(jsonb) to authenticated;
