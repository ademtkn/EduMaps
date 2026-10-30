-- Reviews, favorites, education hub, community, advertising, audit and media.

-- ---------------------------------------------------------------------------
-- Reviews
-- ---------------------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  relationship text not null default 'parent' check (relationship in ('parent', 'student', 'alumni', 'teacher')),
  rating smallint not null check (rating between 1 and 5),
  rating_teaching smallint check (rating_teaching between 1 and 5),
  rating_facilities smallint check (rating_facilities between 1 and 5),
  rating_safety smallint check (rating_safety between 1 and 5),
  rating_communication smallint check (rating_communication between 1 and 5),
  title text not null check (char_length(title) between 3 and 120),
  body text not null check (char_length(body) between 30 and 3000),
  body_hash text not null,
  status public.moderation_status not null default 'pending',
  is_flagged boolean not null default false,
  flag_reason text,
  moderation_note text,
  moderated_by uuid references public.users (id) on delete set null,
  moderated_at timestamptz,
  helpful_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, user_id)
);
create index reviews_school_status_idx on public.reviews (school_id, status, created_at desc);
create index reviews_user_idx on public.reviews (user_id);
create index reviews_status_idx on public.reviews (status, created_at);
create index reviews_hash_idx on public.reviews (body_hash);

create table public.review_votes (
  review_id uuid not null references public.reviews (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  is_helpful boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (review_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Education hub
-- ---------------------------------------------------------------------------
create table public.article_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name jsonb not null check (public.is_i18n(name) and name ? 'en'),
  description jsonb check (public.is_i18n(description)),
  sort_order smallint not null default 0
);

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  category_id uuid not null references public.article_categories (id) on delete restrict,
  kind public.article_kind not null default 'article',
  title jsonb not null check (public.is_i18n(title) and title ? 'en'),
  excerpt jsonb check (public.is_i18n(excerpt)),
  body jsonb check (public.is_i18n(body)),
  cover_url text,
  video_url text check (video_url is null or video_url ~* '^https://'),
  author_id uuid references public.profiles (user_id) on delete set null,
  tags text[] not null default '{}',
  reading_minutes smallint not null default 5 check (reading_minutes between 1 and 120),
  status public.publish_status not null default 'draft',
  is_featured boolean not null default false,
  view_count bigint not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index articles_category_idx on public.articles (category_id, status, published_at desc);
create index articles_published_idx on public.articles (status, published_at desc);
create trigger articles_touch before update on public.articles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Favorites (a row points at exactly one school or one article)
-- ---------------------------------------------------------------------------
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  school_id uuid references public.schools (id) on delete cascade,
  article_id uuid references public.articles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint favorites_one_target check (num_nonnulls(school_id, article_id) = 1)
);
create unique index favorites_user_school_uq on public.favorites (user_id, school_id) where school_id is not null;
create unique index favorites_user_article_uq on public.favorites (user_id, article_id) where article_id is not null;
create index favorites_user_idx on public.favorites (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Community
-- ---------------------------------------------------------------------------
create table public.community_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name jsonb not null check (public.is_i18n(name) and name ? 'en'),
  description jsonb check (public.is_i18n(description)),
  sort_order smallint not null default 0
);

create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.community_categories (id) on delete restrict,
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  title text not null check (char_length(title) between 5 and 160),
  body text not null check (char_length(body) between 20 and 5000),
  body_hash text not null,
  status public.moderation_status not null default 'pending',
  is_flagged boolean not null default false,
  flag_reason text,
  moderation_note text,
  moderated_by uuid references public.users (id) on delete set null,
  moderated_at timestamptz,
  is_pinned boolean not null default false,
  comment_count integer not null default 0,
  view_count bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index community_posts_feed_idx on public.community_posts (category_id, status, is_pinned desc, created_at desc);
create index community_posts_user_idx on public.community_posts (user_id);
create index community_posts_status_idx on public.community_posts (status, created_at);

create table public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  body text not null check (char_length(body) between 2 and 2000),
  status public.moderation_status not null default 'published' check (status in ('published', 'hidden')),
  is_flagged boolean not null default false,
  created_at timestamptz not null default now()
);
create index community_comments_post_idx on public.community_comments (post_id, created_at);
create index community_comments_user_idx on public.community_comments (user_id, created_at desc);

-- Reader reports. Inserting one flags the target for moderators.
create table public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.users (id) on delete cascade,
  entity_type text not null check (entity_type in ('review', 'post', 'comment')),
  entity_id uuid not null,
  reason text not null check (char_length(reason) between 3 and 500),
  is_resolved boolean not null default false,
  created_at timestamptz not null default now(),
  unique (reporter_id, entity_type, entity_id)
);
create index content_reports_open_idx on public.content_reports (is_resolved, created_at desc);

-- ---------------------------------------------------------------------------
-- Advertising (internal system, never influences ranking)
-- ---------------------------------------------------------------------------
create table public.advertisements (
  id uuid primary key default gen_random_uuid(),
  advertiser_name text not null check (char_length(advertiser_name) between 2 and 120),
  customer_type public.ad_customer_type not null default 'other',
  placement public.ad_placement not null,
  headline jsonb not null check (public.is_i18n(headline) and headline ? 'en'),
  body jsonb check (public.is_i18n(body)),
  cta_label jsonb check (public.is_i18n(cta_label)),
  image_url text,
  target_url text not null check (target_url ~* '^https?://'),
  target_languages text[] not null default '{}' check (target_languages <@ array['kg', 'ru', 'en']::text[]),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  is_active boolean not null default true,
  impressions bigint not null default 0,
  clicks bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint advertisements_dates check (ends_at is null or ends_at > starts_at)
);
create index advertisements_serving_idx on public.advertisements (placement, is_active, starts_at, ends_at);
create trigger advertisements_touch before update on public.advertisements
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Audit, analytics, media
-- ---------------------------------------------------------------------------
create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.users (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs (created_at desc);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);

create table public.page_events (
  id bigint generated always as identity primary key,
  event_type text not null check (event_type in (
    'school_view', 'article_view', 'post_view', 'search', 'map_open', 'compare', 'ad_impression', 'ad_click'
  )),
  entity_id uuid,
  lang text check (lang in ('kg', 'ru', 'en')),
  created_at timestamptz not null default now()
);
create index page_events_created_idx on public.page_events (created_at desc, event_type);

create table public.media_files (
  id uuid primary key default gen_random_uuid(),
  bucket text not null default 'media',
  path text not null,
  public_url text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  alt jsonb check (public.is_i18n(alt)),
  uploaded_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (bucket, path)
);
create index media_files_created_idx on public.media_files (created_at desc);
