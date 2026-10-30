-- Tuition in the school's own billing period, plus what the tuition includes.
-- schools.fee_* is what the school advertises (per month, quarter or year). schools.tuition_min/max stay as the
-- monthly equivalent, kept up to date by a trigger, so filters, sorting, maps and comparisons keep working unchanged.
alter table public.schools
  add column fee_min integer check (fee_min >= 0),
  add column fee_max integer check (fee_max >= 0),
  add column fee_period text not null default 'month' check (fee_period in ('month', 'quarter', 'year')),
  add column fee_billing_months smallint not null default 9 check (fee_billing_months between 9 and 12),
  add constraint schools_fee_order check (fee_max is null or fee_min is null or fee_max >= fee_min);

-- Existing amounts were entered per month.
update public.schools set fee_min = tuition_min, fee_max = tuition_max;

create or replace function public.schools_fee_normalize()
returns trigger language plpgsql as $$
declare
  v_periods_per_year numeric := case new.fee_period when 'month' then new.fee_billing_months when 'quarter' then 4 else 1 end;
begin
  -- monthly equivalent = amount x periods per year / months in the school year
  new.tuition_min := case when new.fee_min is null then null else round(new.fee_min * v_periods_per_year / new.fee_billing_months)::integer end;
  new.tuition_max := case when new.fee_max is null then null else round(new.fee_max * v_periods_per_year / new.fee_billing_months)::integer end;
  return new;
end; $$;
create trigger schools_fee_normalize before insert or update on public.schools
  for each row execute function public.schools_fee_normalize();
update public.schools set fee_min = fee_min;

-- Admin-managed list of things a school may include in (or charge on top of) tuition.
create table public.fee_items (
  key text primary key check (key ~ '^[a-z0-9]+(_[a-z0-9]+)*$'),
  name jsonb not null check (public.is_i18n(name) and name ? 'en'),
  icon text not null default 'check',
  sort_order smallint not null default 0,
  is_active boolean not null default true
);
insert into public.fee_items (key, name, icon, sort_order) values
  ('uniform','{"kg": "Мектеп формасы", "ru": "Школьная форма", "en": "School uniform"}','shirt',1),
  ('meals','{"kg": "Тамактануу", "ru": "Питание", "en": "Meals"}','utensils',2),
  ('transport','{"kg": "Мектеп транспорту", "ru": "Школьный транспорт", "en": "School transport"}','bus',3),
  ('clubs','{"kg": "Үйрмөктөр жана секциялар", "ru": "Кружки и секции", "en": "Clubs and activities"}','trophy',4),
  ('books','{"kg": "Окуу китептери", "ru": "Учебники", "en": "Textbooks"}','book-open',5),
  ('stationery','{"kg": "Канцтовар", "ru": "Канцелярские товары", "en": "Stationery"}','pencil',6),
  ('exams','{"kg": "Экзамен жана сертификат төлөмдөрү", "ru": "Экзамены и сертификаты", "en": "Exam and certificate fees"}','graduation-cap',7);

-- Per school: included in the tuition, or paid separately (optionally with the extra cost). No row = not stated.
create table public.school_fee_items (
  school_id uuid not null references public.schools (id) on delete cascade,
  item_key text not null references public.fee_items (key) on update cascade on delete restrict,
  included boolean not null,
  extra_amount integer check (extra_amount >= 0),
  extra_period text check (extra_period in ('one_time', 'year', 'month')),
  primary key (school_id, item_key),
  constraint school_fee_items_extra_check check (
    (included and extra_amount is null and extra_period is null)
    or (not included and (extra_amount is null) = (extra_period is null))
  )
);

alter table public.fee_items enable row level security;
alter table public.school_fee_items enable row level security;
create policy fee_items_read on public.fee_items for select using (true);
create policy fee_items_admin on public.fee_items for all using (public.is_admin()) with check (public.is_admin());
create policy school_fee_items_read on public.school_fee_items for select using (
  public.is_admin() or exists (select 1 from public.schools s where s.id = school_id and s.status = 'published')
);
create policy school_fee_items_admin on public.school_fee_items for all using (public.is_admin()) with check (public.is_admin());
grant select on public.fee_items, public.school_fee_items to anon, authenticated;
grant insert, update, delete on public.fee_items, public.school_fee_items to authenticated;
create trigger fee_items_audit after insert or update or delete on public.fee_items for each row execute function public.log_audit();

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
      nullif(p ->> 'fee_min', '')::integer, nullif(p ->> 'fee_max', '')::integer,
      coalesce(nullif(p ->> 'fee_period', ''), 'month'), coalesce(nullif(p ->> 'fee_billing_months', '')::smallint, 9),
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
      fee_min = nullif(p ->> 'fee_min', '')::integer,
      fee_max = nullif(p ->> 'fee_max', '')::integer,
      fee_period = coalesce(nullif(p ->> 'fee_period', ''), 'month'),
      fee_billing_months = coalesce(nullif(p ->> 'fee_billing_months', '')::smallint, 9),
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
