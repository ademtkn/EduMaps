-- Transactional school editor: one call saves the school and all of its child records.
-- SECURITY INVOKER: row level security still applies, and the admin check is explicit.

create or replace function public.admin_save_school(p jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid := nullif(p ->> 'id', '')::uuid;
  v_loc jsonb := p -> 'location';
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if v_id is null then
    insert into public.schools (
      slug, name, tagline, about, city_id, school_type, education_systems, grade_from, grade_to,
      founded_year, student_count, teacher_count, avg_class_size, tuition_min, tuition_max, tuition_notes,
      has_scholarships, scholarships, has_transportation, transportation_info, has_boarding, boarding_info,
      phone, email, website, social, logo_url, cover_url, status, is_featured
    ) values (
      p ->> 'slug', p -> 'name',
      case when jsonb_typeof(p -> 'tagline') = 'object' then p -> 'tagline' end,
      case when jsonb_typeof(p -> 'about') = 'object' then p -> 'about' end,
      (p ->> 'city_id')::uuid, (p ->> 'school_type')::public.school_type,
      coalesce(array(select jsonb_array_elements_text(coalesce(p -> 'education_systems', '[]'::jsonb))), '{}'),
      coalesce(nullif(p ->> 'grade_from', '')::smallint, 1), coalesce(nullif(p ->> 'grade_to', '')::smallint, 11),
      nullif(p ->> 'founded_year', '')::smallint, nullif(p ->> 'student_count', '')::integer,
      nullif(p ->> 'teacher_count', '')::integer, nullif(p ->> 'avg_class_size', '')::smallint,
      nullif(p ->> 'tuition_min', '')::integer, nullif(p ->> 'tuition_max', '')::integer,
      case when jsonb_typeof(p -> 'tuition_notes') = 'object' then p -> 'tuition_notes' end,
      coalesce((p ->> 'has_scholarships')::boolean, false),
      case when jsonb_typeof(p -> 'scholarships') = 'object' then p -> 'scholarships' end,
      coalesce((p ->> 'has_transportation')::boolean, false),
      case when jsonb_typeof(p -> 'transportation_info') = 'object' then p -> 'transportation_info' end,
      coalesce((p ->> 'has_boarding')::boolean, false),
      case when jsonb_typeof(p -> 'boarding_info') = 'object' then p -> 'boarding_info' end,
      nullif(p ->> 'phone', ''), nullif(p ->> 'email', ''), nullif(p ->> 'website', ''),
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
      tuition_min = nullif(p ->> 'tuition_min', '')::integer,
      tuition_max = nullif(p ->> 'tuition_max', '')::integer,
      tuition_notes = case when jsonb_typeof(p -> 'tuition_notes') = 'object' then p -> 'tuition_notes' end,
      has_scholarships = coalesce((p ->> 'has_scholarships')::boolean, false),
      scholarships = case when jsonb_typeof(p -> 'scholarships') = 'object' then p -> 'scholarships' end,
      has_transportation = coalesce((p ->> 'has_transportation')::boolean, false),
      transportation_info = case when jsonb_typeof(p -> 'transportation_info') = 'object' then p -> 'transportation_info' end,
      has_boarding = coalesce((p ->> 'has_boarding')::boolean, false),
      boarding_info = case when jsonb_typeof(p -> 'boarding_info') = 'object' then p -> 'boarding_info' end,
      phone = nullif(p ->> 'phone', ''),
      email = nullif(p ->> 'email', ''),
      website = nullif(p ->> 'website', ''),
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
    values (v_id, (v_loc ->> 'lat')::numeric, (v_loc ->> 'lng')::numeric, coalesce(v_loc -> 'address', '{}'::jsonb), nullif(v_loc ->> 'district', ''))
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

  delete from public.school_media where school_id = v_id;
  insert into public.school_media (school_id, kind, url, storage_path, caption, sort_order)
  select v_id, x.kind, x.url, nullif(x.storage_path, ''),
         case when jsonb_typeof(x.caption) = 'object' then x.caption end,
         coalesce(x.sort_order, (row_number() over ())::smallint)
  from jsonb_to_recordset(coalesce(p -> 'media', '[]'::jsonb))
    as x(kind public.media_kind, url text, storage_path text, caption jsonb, sort_order smallint);

  delete from public.school_faqs where school_id = v_id;
  insert into public.school_faqs (school_id, question, answer, sort_order)
  select v_id, x.question, x.answer, coalesce(x.sort_order, (row_number() over ())::smallint)
  from jsonb_to_recordset(coalesce(p -> 'faqs', '[]'::jsonb)) as x(question jsonb, answer jsonb, sort_order smallint);

  return v_id;
end;
$$;

revoke execute on function public.admin_save_school(jsonb) from public, anon;
grant execute on function public.admin_save_school(jsonb) to authenticated;
