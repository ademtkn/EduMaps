-- 1. Only the EduMaps team edits school pages: the representative / claim feature is removed.
drop trigger if exists school_claims_sync on public.school_claims;
drop function if exists public.submit_school_update(uuid, jsonb);
drop function if exists public.submit_school_claim(uuid, text, text, text, text);
drop function if exists public.is_school_manager(uuid);
drop function if exists public.sync_school_claimed();
drop table if exists public.school_update_requests;
drop table if exists public.school_claims;
alter table public.schools drop column if exists claimed;

-- 2. Correction requests: anyone, including school staff, can send information; only administrators change pages.
alter table public.correction_requests
  add column reporter_role text not null default 'visitor' check (reporter_role in ('visitor', 'parent', 'school_staff', 'other')),
  add column reporter_phone text check (reporter_phone is null or char_length(reporter_phone) <= 40);
alter table public.correction_requests drop constraint correction_requests_topic_check;
alter table public.correction_requests add constraint correction_requests_topic_check
  check (topic in ('contact', 'address', 'fees', 'hours', 'programs', 'closed', 'missing', 'other'));

drop function if exists public.submit_correction_request(uuid, text, text, text, text, text, text);
create or replace function public.submit_correction_request(
  p_school uuid, p_topic text, p_message text, p_source text, p_name text, p_email text, p_lang text,
  p_role text default 'visitor', p_phone text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_email text := nullif(lower(btrim(coalesce(p_email, ''))), '');
  v_phone text := nullif(btrim(coalesce(p_phone, '')), '');
  v_message text := btrim(coalesce(p_message, ''));
begin
  if not exists (select 1 from public.schools where id = p_school and status = 'published') then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  if p_role = 'school_staff' and v_email is null and v_phone is null then
    raise exception 'contact_needed' using errcode = 'P0001';
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

  insert into public.correction_requests (school_id, topic, message, source_url, reporter_name, reporter_email, reporter_phone, reporter_role, user_id, lang)
  values (p_school, p_topic, v_message, nullif(btrim(coalesce(p_source, '')), ''), nullif(btrim(coalesce(p_name, '')), ''), v_email, v_phone,
          coalesce(p_role, 'visitor'), auth.uid(), coalesce(p_lang, 'en'))
  returning id into v_id;
  return v_id;
end; $$;
revoke all on function public.submit_correction_request(uuid, text, text, text, text, text, text, text, text) from public;
grant execute on function public.submit_correction_request(uuid, text, text, text, text, text, text, text, text) to anon, authenticated;

-- 3. WhatsApp number per school (international format, e.g. +996555123456).
alter table public.schools add column whatsapp text check (whatsapp is null or whatsapp ~ '^\+[1-9][0-9]{9,14}$');

-- 4. Anonymous interest statistics: which contact button was pressed, which part of a school page was reached,
--    how long it stayed open (in ranges) and where the visit came from inside the site. No cookies, no identifiers.
alter table public.page_events add column meta text check (meta is null or meta ~ '^[a-z0-9_]{1,24}$');
alter table public.page_events drop constraint page_events_event_type_check;
alter table public.page_events add constraint page_events_event_type_check check (event_type in (
  'school_view', 'article_view', 'post_view', 'search', 'map_open', 'compare', 'ad_impression', 'ad_click',
  'contact_click', 'section_view', 'time_on_page', 'compare_add'
));
create index page_events_entity_idx on public.page_events (entity_id, event_type, created_at desc);

drop function if exists public.track_event(text, uuid, text);
create or replace function public.track_event(p_type text, p_entity uuid default null, p_lang text default null, p_meta text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_updated integer := 0;
begin
  if p_lang is not null and p_lang not in ('kg', 'ru', 'en') then p_lang := null; end if;
  if p_meta is not null and p_meta !~ '^[a-z0-9_]{1,24}$' then p_meta := null; end if;

  if p_type = 'school_view' then
    update public.schools set view_count = view_count + 1 where id = p_entity and status = 'published';
    get diagnostics v_updated = row_count;
  elsif p_type in ('contact_click', 'section_view', 'time_on_page', 'compare_add') then
    if p_meta is null and p_type <> 'compare_add' then return; end if;
    select count(*) into v_updated from public.schools where id = p_entity and status = 'published';
  elsif p_type = 'article_view' then
    update public.articles set view_count = view_count + 1 where id = p_entity and status = 'published';
    get diagnostics v_updated = row_count;
  elsif p_type = 'post_view' then
    perform set_config('app.system_write', '1', true);
    update public.community_posts set view_count = view_count + 1 where id = p_entity and status = 'published';
    get diagnostics v_updated = row_count;
    perform set_config('app.system_write', '', true);
  elsif p_type in ('search', 'map_open', 'compare') then
    v_updated := 1;
  else
    return;
  end if;

  if v_updated > 0 then
    insert into public.page_events (event_type, entity_id, lang, meta) values (p_type, p_entity, p_lang, p_meta);
  end if;
end; $$;
revoke all on function public.track_event(text, uuid, text, text) from public;
grant execute on function public.track_event(text, uuid, text, text) to anon, authenticated;

-- Per-school summary for the admin statistics page.
create or replace function public.admin_school_stats(p_days integer default 30)
returns table (
  school_id uuid, views bigint, whatsapp bigint, phone bigint, email bigint, website bigint, directions bigint, shares bigint, compare_adds bigint, favorites bigint
) language plpgsql stable security definer set search_path = public as $$
declare v_since timestamptz := now() - make_interval(days => greatest(1, least(p_days, 365)));
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
  select s.id,
    count(*) filter (where e.event_type = 'school_view'),
    count(*) filter (where e.event_type = 'contact_click' and e.meta = 'whatsapp'),
    count(*) filter (where e.event_type = 'contact_click' and e.meta = 'phone'),
    count(*) filter (where e.event_type = 'contact_click' and e.meta = 'email'),
    count(*) filter (where e.event_type = 'contact_click' and e.meta = 'website'),
    count(*) filter (where e.event_type = 'contact_click' and e.meta in ('directions', 'google_maps', 'gis2')),
    count(*) filter (where e.event_type = 'contact_click' and e.meta = 'share'),
    count(*) filter (where e.event_type = 'compare_add'),
    (select count(*) from public.favorites f where f.school_id = s.id and f.created_at >= v_since)
  from public.schools s
  left join public.page_events e on e.entity_id = s.id and e.created_at >= v_since
  where s.status = 'published'
  group by s.id;
end; $$;
revoke execute on function public.admin_school_stats(integer) from public, anon;
grant execute on function public.admin_school_stats(integer) to authenticated;

-- Detail for one school: daily series, languages, sources, sections reached, time on page, contact buttons.
create or replace function public.admin_school_stats_detail(p_school uuid, p_days integer default 30)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_days integer := greatest(1, least(p_days, 365));
  v_since timestamptz := now() - make_interval(days => v_days);
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return jsonb_build_object(
    'daily', coalesce((select jsonb_agg(jsonb_build_object('day', d.day, 'views', d.views, 'contacts', d.contacts) order by d.day) from (
      select (e.created_at at time zone 'Asia/Bishkek')::date as day,
             count(*) filter (where e.event_type = 'school_view') as views,
             count(*) filter (where e.event_type = 'contact_click' and e.meta in ('whatsapp', 'phone', 'email')) as contacts
      from public.page_events e where e.entity_id = p_school and e.created_at >= v_since group by 1) d), '[]'::jsonb),
    'by_lang', coalesce((select jsonb_object_agg(coalesce(lang, 'unknown'), n) from (
      select lang, count(*) as n from public.page_events where entity_id = p_school and event_type = 'school_view' and created_at >= v_since group by lang) x), '{}'::jsonb),
    'sources', coalesce((select jsonb_object_agg(coalesce(meta, 'unknown'), n) from (
      select meta, count(*) as n from public.page_events where entity_id = p_school and event_type = 'school_view' and created_at >= v_since group by meta) x), '{}'::jsonb),
    'sections', coalesce((select jsonb_object_agg(meta, n) from (
      select meta, count(*) as n from public.page_events where entity_id = p_school and event_type = 'section_view' and created_at >= v_since group by meta) x), '{}'::jsonb),
    'time', coalesce((select jsonb_object_agg(meta, n) from (
      select meta, count(*) as n from public.page_events where entity_id = p_school and event_type = 'time_on_page' and created_at >= v_since group by meta) x), '{}'::jsonb),
    'contacts', coalesce((select jsonb_object_agg(meta, n) from (
      select meta, count(*) as n from public.page_events where entity_id = p_school and event_type = 'contact_click' and created_at >= v_since group by meta) x), '{}'::jsonb),
    'compare_adds', (select count(*) from public.page_events where entity_id = p_school and event_type = 'compare_add' and created_at >= v_since),
    'favorites', (select count(*) from public.favorites where school_id = p_school and created_at >= v_since),
    'views', (select count(*) from public.page_events where entity_id = p_school and event_type = 'school_view' and created_at >= v_since)
  );
end; $$;
revoke execute on function public.admin_school_stats_detail(uuid, integer) from public, anon;
grant execute on function public.admin_school_stats_detail(uuid, integer) to authenticated;

-- 5. The school editor saves the WhatsApp number too.
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

  delete from public.school_faqs where school_id = v_id;
  insert into public.school_faqs (school_id, question, answer, sort_order)
  select v_id, x.question, x.answer, coalesce(x.sort_order, (row_number() over ())::smallint)
  from jsonb_to_recordset(coalesce(p -> 'faqs', '[]'::jsonb)) as x(question jsonb, answer jsonb, sort_order smallint);

  return v_id;
end;
$$;

revoke execute on function public.admin_save_school(jsonb) from public, anon;
grant execute on function public.admin_save_school(jsonb) to authenticated;
