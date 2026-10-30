-- EduMaps.kg core schema: identity, geography, schools and their child entities.
-- Every translatable field is a jsonb object keyed by language code: {"kg": "...", "ru": "...", "en": "..."}.

create extension if not exists pg_trgm with schema extensions;
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('user', 'moderator', 'admin');
create type public.school_type as enum ('public', 'private', 'international', 'specialized');
create type public.publish_status as enum ('draft', 'published', 'archived');
create type public.program_kind as enum ('academic', 'club', 'sport');
create type public.media_kind as enum ('image', 'video');
create type public.moderation_status as enum ('pending', 'published', 'rejected', 'hidden');
create type public.article_kind as enum ('article', 'video', 'guide');
create type public.ad_placement as enum ('banner', 'sidebar', 'featured_article');
create type public.ad_customer_type as enum (
  'language_school', 'summer_camp', 'robotics_center', 'edu_company', 'edu_event', 'other'
);

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- A translatable field must be a json object whose keys are supported language codes.
create or replace function public.is_i18n(value jsonb)
returns boolean
language sql
immutable
as $$
  select value is null
    or (
      jsonb_typeof(value) = 'object'
      and not exists (
        select 1 from jsonb_object_keys(value) k where k not in ('kg', 'ru', 'en')
      )
    );
$$;

-- ---------------------------------------------------------------------------
-- Geography
-- ---------------------------------------------------------------------------
create table public.provinces (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name jsonb not null check (public.is_i18n(name) and name ? 'en'),
  description jsonb check (public.is_i18n(description)),
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);

create table public.cities (
  id uuid primary key default gen_random_uuid(),
  province_id uuid not null references public.provinces (id) on delete restrict,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name jsonb not null check (public.is_i18n(name) and name ? 'en'),
  description jsonb check (public.is_i18n(description)),
  lat numeric(9, 6) not null check (lat between 39 and 44),
  lng numeric(9, 6) not null check (lng between 69 and 81),
  zoom numeric(3, 1) not null default 11,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);
create index cities_province_idx on public.cities (province_id);

-- ---------------------------------------------------------------------------
-- Users and profiles (public.users mirrors auth.users and carries the app role)
-- ---------------------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role public.user_role not null default 'user',
  is_banned boolean not null default false,
  ban_reason text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);
create index users_role_idx on public.users (role);

create table public.profiles (
  user_id uuid primary key references public.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 60),
  avatar_url text,
  bio text check (char_length(bio) <= 500),
  city_id uuid references public.cities (id) on delete set null,
  preferred_lang text not null default 'kg' check (preferred_lang in ('kg', 'ru', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Languages (site languages, managed by admins)
-- ---------------------------------------------------------------------------
create table public.languages (
  code text primary key check (code in ('kg', 'ru', 'en')),
  name text not null,
  native_name text not null,
  html_lang text not null,
  is_enabled boolean not null default true,
  is_default boolean not null default false,
  sort_order smallint not null default 0
);
create unique index languages_single_default on public.languages (is_default) where is_default;

-- ---------------------------------------------------------------------------
-- Schools
-- ---------------------------------------------------------------------------
create table public.schools (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name jsonb not null check (public.is_i18n(name) and name ? 'en'),
  tagline jsonb check (public.is_i18n(tagline)),
  about jsonb check (public.is_i18n(about)),
  city_id uuid not null references public.cities (id) on delete restrict,
  school_type public.school_type not null default 'private',
  education_systems text[] not null default '{}'
    check (education_systems <@ array[
      'national', 'ib', 'cambridge', 'american', 'montessori', 'waldorf', 'turkish', 'russian', 'stem'
    ]::text[]),
  grade_from smallint not null default 1 check (grade_from between 0 and 11),
  grade_to smallint not null default 11 check (grade_to between 1 and 12),
  founded_year smallint check (founded_year between 1800 and 2100),
  student_count integer check (student_count >= 0),
  teacher_count integer check (teacher_count >= 0),
  avg_class_size smallint check (avg_class_size between 1 and 80),
  tuition_min integer check (tuition_min >= 0),
  tuition_max integer check (tuition_max >= 0),
  tuition_notes jsonb check (public.is_i18n(tuition_notes)),
  has_scholarships boolean not null default false,
  scholarships jsonb check (public.is_i18n(scholarships)),
  has_transportation boolean not null default false,
  transportation_info jsonb check (public.is_i18n(transportation_info)),
  has_boarding boolean not null default false,
  boarding_info jsonb check (public.is_i18n(boarding_info)),
  has_sports boolean not null default false,
  phone text check (char_length(phone) <= 40),
  email text check (char_length(email) <= 120),
  website text check (website is null or website ~* '^https?://'),
  social jsonb not null default '{}'::jsonb check (jsonb_typeof(social) = 'object'),
  logo_url text,
  cover_url text,
  status public.publish_status not null default 'draft',
  is_featured boolean not null default false,
  rating_avg numeric(3, 2) not null default 0,
  rating_count integer not null default 0,
  view_count bigint not null default 0,
  search_text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint schools_grades_order check (grade_to >= grade_from),
  constraint schools_tuition_order check (tuition_max is null or tuition_min is null or tuition_max >= tuition_min)
);
create index schools_city_idx on public.schools (city_id);
create index schools_status_idx on public.schools (status);
create index schools_rating_idx on public.schools (rating_avg desc, rating_count desc);
create index schools_updated_idx on public.schools (updated_at desc);
create index schools_systems_idx on public.schools using gin (education_systems);
create index schools_search_idx on public.schools using gin (search_text extensions.gin_trgm_ops);

create table public.school_locations (
  school_id uuid primary key references public.schools (id) on delete cascade,
  lat numeric(9, 6) not null check (lat between 39 and 44),
  lng numeric(9, 6) not null check (lng between 69 and 81),
  address jsonb not null check (public.is_i18n(address)),
  district text
);
create index school_locations_coords_idx on public.school_locations (lat, lng);

create table public.school_languages (
  school_id uuid not null references public.schools (id) on delete cascade,
  language_code text not null check (language_code in ('kg', 'ru', 'en', 'tr', 'de', 'zh', 'fr', 'ar')),
  is_primary boolean not null default false,
  primary key (school_id, language_code)
);

create table public.school_programs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  kind public.program_kind not null,
  name jsonb not null check (public.is_i18n(name) and name ? 'en'),
  description jsonb check (public.is_i18n(description)),
  sort_order smallint not null default 0
);
create index school_programs_school_idx on public.school_programs (school_id, kind);

create table public.school_facilities (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  facility_key text not null check (facility_key in (
    'library', 'science_lab', 'computer_lab', 'robotics_lab', 'gym', 'swimming_pool', 'stadium',
    'canteen', 'medical_room', 'playground', 'art_studio', 'music_room', 'theater', 'security',
    'cctv', 'wifi', 'dormitory', 'parking', 'psychologist', 'speech_therapist', 'accessible'
  )),
  note jsonb check (public.is_i18n(note)),
  unique (school_id, facility_key)
);

create table public.school_media (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  kind public.media_kind not null,
  url text not null,
  storage_path text,
  caption jsonb check (public.is_i18n(caption)),
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  constraint school_media_url_scheme check (url ~* '^https?://')
);
create index school_media_school_idx on public.school_media (school_id, sort_order);

create table public.school_faqs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  question jsonb not null check (public.is_i18n(question) and question ? 'en'),
  answer jsonb not null check (public.is_i18n(answer) and answer ? 'en'),
  sort_order smallint not null default 0
);
create index school_faqs_school_idx on public.school_faqs (school_id, sort_order);

create trigger schools_touch before update on public.schools
  for each row execute function public.touch_updated_at();
