-- Admin-managed option lists for school profiles (education systems, facilities, languages of instruction).
create table public.education_systems (
  key text primary key check (key ~ '^[a-z0-9]+(_[a-z0-9]+)*$'),
  name jsonb not null check (public.is_i18n(name) and name ? 'en'),
  sort_order smallint not null default 0,
  is_active boolean not null default true
);
create table public.facility_types (
  key text primary key check (key ~ '^[a-z0-9]+(_[a-z0-9]+)*$'),
  name jsonb not null check (public.is_i18n(name) and name ? 'en'),
  icon text not null default 'check',
  sort_order smallint not null default 0,
  is_active boolean not null default true
);
create table public.language_options (
  code text primary key check (code ~ '^[a-z]{2,3}$'),
  name jsonb not null check (public.is_i18n(name) and name ? 'en'),
  sort_order smallint not null default 0,
  is_active boolean not null default true
);

insert into public.education_systems (key,name,sort_order) values
  ('national','{"kg": "Улуттук программа", "ru": "Национальная программа", "en": "National curriculum"}',1),
  ('ib','{"kg": "Эл аралык бакалавриат", "ru": "Международный бакалавриат", "en": "International Baccalaureate"}',2),
  ('cambridge','{"kg": "Cambridge", "ru": "Cambridge", "en": "Cambridge"}',3),
  ('american','{"kg": "Америкалык", "ru": "Американская", "en": "American"}',4),
  ('montessori','{"kg": "Монтессори", "ru": "Монтессори", "en": "Montessori"}',5),
  ('waldorf','{"kg": "Вальдорф", "ru": "Вальдорф", "en": "Waldorf"}',6),
  ('turkish','{"kg": "Түрк программасы", "ru": "Турецкая", "en": "Turkish"}',7),
  ('russian','{"kg": "Орус стандарты", "ru": "Российский стандарт", "en": "Russian standard"}',8),
  ('stem','{"kg": "STEM багыты", "ru": "Направление STEM", "en": "STEM focused"}',9);

insert into public.language_options (code,name,sort_order) values
  ('kg','{"kg": "Кыргызча", "ru": "Кыргызский", "en": "Kyrgyz"}',1),
  ('ru','{"kg": "Орусча", "ru": "Русский", "en": "Russian"}',2),
  ('en','{"kg": "Англисче", "ru": "Английский", "en": "English"}',3),
  ('tr','{"kg": "Түркчө", "ru": "Турецкий", "en": "Turkish"}',4),
  ('de','{"kg": "Немисче", "ru": "Немецкий", "en": "German"}',5),
  ('zh','{"kg": "Кытайча", "ru": "Китайский", "en": "Chinese"}',6),
  ('fr','{"kg": "Французча", "ru": "Французский", "en": "French"}',7),
  ('ar','{"kg": "Арабча", "ru": "Арабский", "en": "Arabic"}',8);

insert into public.facility_types (key,name,icon,sort_order) values
  ('library','{"kg": "Китепкана", "ru": "Библиотека", "en": "Library"}','library',1),
  ('science_lab','{"kg": "Илимий лабораториялар", "ru": "Научные лаборатории", "en": "Science laboratories"}','flask',2),
  ('computer_lab','{"kg": "Компьютер классы", "ru": "Компьютерный класс", "en": "Computer lab"}','laptop',3),
  ('robotics_lab','{"kg": "Робототехника лабораториясы", "ru": "Лаборатория робототехники", "en": "Robotics lab"}','bot',4),
  ('gym','{"kg": "Спорт зал", "ru": "Спортивный зал", "en": "Gymnasium"}','dumbbell',5),
  ('swimming_pool','{"kg": "Бассейн", "ru": "Бассейн", "en": "Swimming pool"}','waves',6),
  ('stadium','{"kg": "Стадион / спорт аянтчасы", "ru": "Стадион / спортивная площадка", "en": "Stadium / sports field"}','trees',7),
  ('canteen','{"kg": "Ашкана", "ru": "Столовая", "en": "Canteen"}','utensils',8),
  ('medical_room','{"kg": "Медициналык кабинет", "ru": "Медицинский кабинет", "en": "Medical room"}','heart-pulse',9),
  ('playground','{"kg": "Оюн аянтчасы", "ru": "Игровая площадка", "en": "Playground"}','trees',10),
  ('art_studio','{"kg": "Сүрөт студиясы", "ru": "Художественная студия", "en": "Art studio"}','palette',11),
  ('music_room','{"kg": "Музыка классы", "ru": "Музыкальный класс", "en": "Music room"}','music',12),
  ('theater','{"kg": "Акт залы / театр", "ru": "Актовый зал / театр", "en": "Theatre / assembly hall"}','theater',13),
  ('security','{"kg": "Кайтаруу", "ru": "Охрана", "en": "On-site security"}','shield',14),
  ('cctv','{"kg": "Видео көзөмөл", "ru": "Видеонаблюдение", "en": "CCTV"}','camera',15),
  ('wifi','{"kg": "Wi-Fi", "ru": "Wi-Fi", "en": "Wi-Fi"}','wifi',16),
  ('dormitory','{"kg": "Жатакана", "ru": "Общежитие", "en": "Dormitory"}','building',17),
  ('parking','{"kg": "Унаа токтотуучу жай", "ru": "Парковка", "en": "Parking"}','parking',18),
  ('psychologist','{"kg": "Мектеп психологу", "ru": "Школьный психолог", "en": "School psychologist"}','stethoscope',19),
  ('speech_therapist','{"kg": "Логопед", "ru": "Логопед", "en": "Speech therapist"}','book-open',20),
  ('accessible','{"kg": "Коляскалар үчүн ыңгайлуу", "ru": "Доступно для колясок", "en": "Accessible for wheelchairs"}','accessibility',21);


-- Replace hard-coded CHECK constraints with references to the managed lists.
alter table public.schools drop constraint schools_education_systems_check;
alter table public.school_facilities drop constraint school_facilities_facility_key_check;
alter table public.school_languages drop constraint school_languages_language_code_check;
alter table public.school_facilities add constraint school_facilities_type_fk foreign key (facility_key) references public.facility_types (key) on update cascade on delete restrict;
alter table public.school_languages add constraint school_languages_option_fk foreign key (language_code) references public.language_options (code) on update cascade on delete restrict;

-- education_systems is an array, so membership is enforced by trigger.
create or replace function public.validate_school_systems()
returns trigger language plpgsql set search_path = public as $$
declare v_bad text;
begin
  select s into v_bad from unnest(new.education_systems) s where not exists (select 1 from public.education_systems e where e.key = s) limit 1;
  if v_bad is not null then
    raise exception 'unknown_education_system: %', v_bad using errcode = '23503';
  end if;
  return new;
end; $$;
create trigger schools_validate_systems before insert or update of education_systems on public.schools
  for each row execute function public.validate_school_systems();

-- Keep the array in step when a system key is deleted (blocked while in use) or renamed.
create or replace function public.guard_education_system_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    if exists (select 1 from public.schools where old.key = any(education_systems)) then
      raise exception 'in_use' using errcode = '23503';
    end if;
    return old;
  end if;
  if new.key <> old.key then
    raise exception 'key_immutable' using errcode = '23514';
  end if;
  return new;
end; $$;
create trigger education_systems_guard before update or delete on public.education_systems
  for each row execute function public.guard_education_system_change();

alter table public.education_systems enable row level security;
alter table public.facility_types enable row level security;
alter table public.language_options enable row level security;
create policy education_systems_read on public.education_systems for select using (true);
create policy education_systems_admin on public.education_systems for all using (public.is_admin()) with check (public.is_admin());
create policy facility_types_read on public.facility_types for select using (true);
create policy facility_types_admin on public.facility_types for all using (public.is_admin()) with check (public.is_admin());
create policy language_options_read on public.language_options for select using (true);
create policy language_options_admin on public.language_options for all using (public.is_admin()) with check (public.is_admin());
grant select on public.education_systems, public.facility_types, public.language_options to anon, authenticated;
grant insert, update, delete on public.education_systems, public.facility_types, public.language_options to authenticated;

create trigger education_systems_audit after insert or update or delete on public.education_systems for each row execute function public.log_audit();
create trigger facility_types_audit after insert or update or delete on public.facility_types for each row execute function public.log_audit();
create trigger language_options_audit after insert or update or delete on public.language_options for each row execute function public.log_audit();

-- Audit rows for tables keyed by text (key / code) need that key as their entity id.
create or replace function public.log_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_noise text[] := array[
    'updated_at', 'view_count', 'rating_avg', 'rating_count', 'helpful_count', 'comment_count',
    'impressions', 'clicks', 'search_text', 'last_seen_at', 'has_sports', 'moderated_at', 'moderated_by'
  ];
  v_old jsonb;
  v_new jsonb;
  v_old_diff jsonb;
  v_new_diff jsonb;
  v_id text;
begin
  if auth.uid() is null or public.is_system_write() then
    return coalesce(new, old);
  end if;

  if tg_op = 'INSERT' then
    v_new := to_jsonb(new) - v_noise;
    v_id := coalesce(to_jsonb(new) ->> 'id', to_jsonb(new) ->> 'key', to_jsonb(new) ->> 'code');
    insert into public.audit_logs (actor_id, action, entity_type, entity_id, new_data)
    values (auth.uid(), 'insert', tg_table_name, v_id, v_new);
    return new;
  elsif tg_op = 'DELETE' then
    v_old := to_jsonb(old) - v_noise;
    v_id := coalesce(to_jsonb(old) ->> 'id', to_jsonb(old) ->> 'key', to_jsonb(old) ->> 'code');
    insert into public.audit_logs (actor_id, action, entity_type, entity_id, old_data)
    values (auth.uid(), 'delete', tg_table_name, v_id, v_old);
    return old;
  end if;

  v_old := to_jsonb(old) - v_noise;
  v_new := to_jsonb(new) - v_noise;
  select coalesce(jsonb_object_agg(n.key, n.value), '{}'::jsonb) into v_new_diff
    from jsonb_each(v_new) n where v_old -> n.key is distinct from n.value;
  if v_new_diff = '{}'::jsonb then
    return new;
  end if;
  select coalesce(jsonb_object_agg(o.key, o.value), '{}'::jsonb) into v_old_diff
    from jsonb_each(v_old) o where v_new_diff ? o.key;
  v_id := coalesce(to_jsonb(new) ->> 'id', to_jsonb(new) ->> 'key', to_jsonb(new) ->> 'code');
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, old_data, new_data)
  values (auth.uid(), 'update', tg_table_name, v_id, v_old_diff, v_new_diff);
  return new;
end;
$$;

