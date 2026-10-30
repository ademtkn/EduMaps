-- Role helpers, anti-spam guards, denormalized counters, audit trail and analytics RPCs.

-- ---------------------------------------------------------------------------
-- Role helpers (security definer so RLS policies can call them without recursion)
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role = 'admin' and not u.is_banned
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role in ('admin', 'moderator') and not u.is_banned
  );
$$;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users u where u.id = auth.uid() and not u.is_banned
  );
$$;

-- ---------------------------------------------------------------------------
-- Sign-up: mirror auth.users into public.users + profiles. Role is never read from client metadata.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_lang text;
begin
  v_name := left(coalesce(nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1)), 60);
  if char_length(v_name) < 2 then
    v_name := rpad(v_name, 2, '_');
  end if;
  v_lang := coalesce(new.raw_user_meta_data ->> 'preferred_lang', 'kg');
  if v_lang not in ('kg', 'ru', 'en') then
    v_lang := 'kg';
  end if;

  insert into public.users (id, email) values (new.id, coalesce(new.email, ''));
  insert into public.profiles (user_id, display_name, preferred_lang) values (new.id, v_name, v_lang);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.sync_user_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users set email = coalesce(new.email, '') where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function public.sync_user_email();

-- ---------------------------------------------------------------------------
-- Spam detection
-- ---------------------------------------------------------------------------
create or replace function public.looks_like_spam(p_text text)
returns boolean
language sql
immutable
as $$
  select
    coalesce(array_length(regexp_split_to_array(coalesce(p_text, ''), '(https?://|www\.)'), 1), 1) - 1 > 2
    or coalesce(p_text, '') ~ '(.)\1{11,}'
    or coalesce(p_text, '') ~* '(casino|viagra|porn|xxx|1xbet|bet365|crypto giveaway|казино|быстрый заработок|заработок без вложений|займ без отказа)';
$$;

create or replace function public.content_hash(p_text text)
returns text
language sql
immutable
as $$
  select md5(lower(regexp_replace(btrim(coalesce(p_text, '')), '\s+', ' ', 'g')));
$$;

-- Marks the rest of the transaction as a trusted system write (counter maintenance).
create or replace function public.is_system_write()
returns boolean
language sql
stable
as $$
  select coalesce(current_setting('app.system_write', true), '') = '1';
$$;

-- ---------------------------------------------------------------------------
-- Guards for user generated, moderated content: spam checks, rate limits, forced moderation
-- ---------------------------------------------------------------------------
create or replace function public.guard_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_staff boolean := auth.uid() is null or public.is_staff();
  v_sys text[] := array[
    'status', 'is_flagged', 'flag_reason', 'moderation_note', 'moderated_by', 'moderated_at',
    'updated_at', 'helpful_count', 'body_hash'
  ];
  v_recent integer;
begin
  if public.is_system_write() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if not v_staff then
      if public.looks_like_spam(new.title || ' ' || new.body) then
        raise exception 'spam_detected' using errcode = 'P0001';
      end if;
      select count(*) into v_recent from public.reviews
        where user_id = new.user_id and created_at > now() - interval '24 hours';
      if v_recent >= 3 then
        raise exception 'rate_limited' using errcode = 'P0001';
      end if;
      new.status := 'pending';
      new.is_flagged := false;
      new.flag_reason := null;
      new.moderation_note := null;
      new.moderated_by := null;
      new.moderated_at := null;
      new.helpful_count := 0;
    end if;
    new.body_hash := public.content_hash(new.body);
    if not v_staff and exists (select 1 from public.reviews r where r.body_hash = new.body_hash) then
      raise exception 'duplicate_content' using errcode = 'P0001';
    end if;
    return new;
  end if;

  new.user_id := old.user_id;
  new.school_id := old.school_id;

  if v_staff then
    if new.status is distinct from old.status
       or new.moderation_note is distinct from old.moderation_note
       or new.is_flagged is distinct from old.is_flagged then
      new.moderated_by := auth.uid();
      new.moderated_at := now();
    end if;
    if new.is_flagged is false and old.is_flagged is true then
      new.flag_reason := null;
    end if;
  else
    if (to_jsonb(new) - v_sys) is distinct from (to_jsonb(old) - v_sys) then
      if public.looks_like_spam(new.title || ' ' || new.body) then
        raise exception 'spam_detected' using errcode = 'P0001';
      end if;
      new.status := 'pending';
      new.body_hash := public.content_hash(new.body);
      new.moderated_by := null;
      new.moderated_at := null;
    else
      new.status := old.status;
      new.body_hash := old.body_hash;
      new.moderated_by := old.moderated_by;
      new.moderated_at := old.moderated_at;
    end if;
    new.is_flagged := old.is_flagged;
    new.flag_reason := old.flag_reason;
    new.moderation_note := old.moderation_note;
    new.helpful_count := old.helpful_count;
  end if;
  return new;
end;
$$;

create trigger reviews_guard before insert or update on public.reviews
  for each row execute function public.guard_review();
create trigger reviews_touch before update on public.reviews
  for each row execute function public.touch_updated_at();

create or replace function public.guard_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_staff boolean := auth.uid() is null or public.is_staff();
  v_sys text[] := array[
    'status', 'is_flagged', 'flag_reason', 'moderation_note', 'moderated_by', 'moderated_at',
    'updated_at', 'comment_count', 'view_count', 'is_pinned', 'body_hash'
  ];
  v_recent integer;
begin
  if public.is_system_write() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if not v_staff then
      if public.looks_like_spam(new.title || ' ' || new.body) then
        raise exception 'spam_detected' using errcode = 'P0001';
      end if;
      select count(*) into v_recent from public.community_posts
        where user_id = new.user_id and created_at > now() - interval '24 hours';
      if v_recent >= 3 then
        raise exception 'rate_limited' using errcode = 'P0001';
      end if;
      new.status := 'pending';
      new.is_flagged := false;
      new.flag_reason := null;
      new.moderation_note := null;
      new.moderated_by := null;
      new.moderated_at := null;
      new.comment_count := 0;
      new.view_count := 0;
      new.is_pinned := false;
    end if;
    new.body_hash := public.content_hash(new.body);
    if not v_staff and exists (select 1 from public.community_posts p where p.body_hash = new.body_hash) then
      raise exception 'duplicate_content' using errcode = 'P0001';
    end if;
    return new;
  end if;

  new.user_id := old.user_id;

  if v_staff then
    if new.status is distinct from old.status
       or new.moderation_note is distinct from old.moderation_note
       or new.is_flagged is distinct from old.is_flagged then
      new.moderated_by := auth.uid();
      new.moderated_at := now();
    end if;
    if new.is_flagged is false and old.is_flagged is true then
      new.flag_reason := null;
    end if;
  else
    if (to_jsonb(new) - v_sys) is distinct from (to_jsonb(old) - v_sys) then
      if public.looks_like_spam(new.title || ' ' || new.body) then
        raise exception 'spam_detected' using errcode = 'P0001';
      end if;
      new.status := 'pending';
      new.body_hash := public.content_hash(new.body);
      new.moderated_by := null;
      new.moderated_at := null;
    else
      new.status := old.status;
      new.body_hash := old.body_hash;
      new.moderated_by := old.moderated_by;
      new.moderated_at := old.moderated_at;
    end if;
    new.is_flagged := old.is_flagged;
    new.flag_reason := old.flag_reason;
    new.moderation_note := old.moderation_note;
    new.comment_count := old.comment_count;
    new.view_count := old.view_count;
    new.is_pinned := old.is_pinned;
  end if;
  return new;
end;
$$;

create trigger posts_guard before insert or update on public.community_posts
  for each row execute function public.guard_post();
create trigger posts_touch before update on public.community_posts
  for each row execute function public.touch_updated_at();

create or replace function public.guard_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_staff boolean := auth.uid() is null or public.is_staff();
  v_recent integer;
begin
  if tg_op = 'INSERT' then
    if not v_staff then
      if public.looks_like_spam(new.body) then
        raise exception 'spam_detected' using errcode = 'P0001';
      end if;
      select count(*) into v_recent from public.community_comments
        where user_id = new.user_id and created_at > now() - interval '1 hour';
      if v_recent >= 20 then
        raise exception 'rate_limited' using errcode = 'P0001';
      end if;
      new.status := 'published';
      new.is_flagged := false;
    end if;
    return new;
  end if;

  new.user_id := old.user_id;
  new.post_id := old.post_id;
  if not v_staff then
    new.body := old.body;
    new.status := old.status;
    new.is_flagged := old.is_flagged;
  end if;
  return new;
end;
$$;

create trigger comments_guard before insert or update on public.community_comments
  for each row execute function public.guard_comment();

-- ---------------------------------------------------------------------------
-- Denormalized counters
-- ---------------------------------------------------------------------------
create or replace function public.refresh_school_rating(p_school uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.schools s
  set rating_avg = coalesce(r.avg_rating, 0),
      rating_count = coalesce(r.total, 0)
  from (
    select round(avg(rating)::numeric, 2) as avg_rating, count(*)::integer as total
    from public.reviews
    where school_id = p_school and status = 'published'
  ) r
  where s.id = p_school;
end;
$$;

create or replace function public.reviews_after_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_school_rating(old.school_id);
    return old;
  end if;
  perform public.refresh_school_rating(new.school_id);
  return new;
end;
$$;

create trigger reviews_rating_refresh
  after insert or update or delete on public.reviews
  for each row execute function public.reviews_after_change();

create or replace function public.review_votes_after_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_review uuid := coalesce(new.review_id, old.review_id);
begin
  perform set_config('app.system_write', '1', true);
  update public.reviews
  set helpful_count = (select count(*) from public.review_votes where review_id = v_review and is_helpful)
  where id = v_review;
  perform set_config('app.system_write', '', true);
  return coalesce(new, old);
end;
$$;

create trigger review_votes_refresh
  after insert or update or delete on public.review_votes
  for each row execute function public.review_votes_after_change();

create or replace function public.comments_after_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post uuid := coalesce(new.post_id, old.post_id);
begin
  perform set_config('app.system_write', '1', true);
  update public.community_posts
  set comment_count = (
    select count(*) from public.community_comments where post_id = v_post and status = 'published'
  )
  where id = v_post;
  perform set_config('app.system_write', '', true);
  return coalesce(new, old);
end;
$$;

create trigger comments_count_refresh
  after insert or update or delete on public.community_comments
  for each row execute function public.comments_after_change();

create or replace function public.programs_after_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_school uuid := coalesce(new.school_id, old.school_id);
begin
  update public.schools
  set has_sports = exists (
    select 1 from public.school_programs where school_id = v_school and kind = 'sport'
  )
  where id = v_school;
  return coalesce(new, old);
end;
$$;

create trigger programs_sports_refresh
  after insert or update or delete on public.school_programs
  for each row execute function public.programs_after_change();

create or replace function public.schools_build_search_text()
returns trigger
language plpgsql
as $$
begin
  new.search_text := lower(
    coalesce(new.name ->> 'kg', '') || ' ' || coalesce(new.name ->> 'ru', '') || ' ' ||
    coalesce(new.name ->> 'en', '') || ' ' || replace(new.slug, '-', ' ')
  );
  return new;
end;
$$;

create trigger schools_search_text before insert or update of name, slug on public.schools
  for each row execute function public.schools_build_search_text();

-- Reader reports flag the target for moderators.
create or replace function public.apply_report_flag()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('app.system_write', '1', true);
  if new.entity_type = 'review' then
    update public.reviews set is_flagged = true, flag_reason = coalesce(flag_reason, new.reason) where id = new.entity_id;
  elsif new.entity_type = 'post' then
    update public.community_posts set is_flagged = true, flag_reason = coalesce(flag_reason, new.reason) where id = new.entity_id;
  else
    update public.community_comments set is_flagged = true where id = new.entity_id;
  end if;
  perform set_config('app.system_write', '', true);
  return new;
end;
$$;

create trigger content_reports_flag after insert on public.content_reports
  for each row execute function public.apply_report_flag();

-- ---------------------------------------------------------------------------
-- Audit trail (only user attributed writes; seeding and system jobs run without a JWT subject)
-- ---------------------------------------------------------------------------
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
    v_id := to_jsonb(new) ->> 'id';
    insert into public.audit_logs (actor_id, action, entity_type, entity_id, new_data)
    values (auth.uid(), 'insert', tg_table_name, v_id, v_new);
    return new;
  elsif tg_op = 'DELETE' then
    v_old := to_jsonb(old) - v_noise;
    v_id := to_jsonb(old) ->> 'id';
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
  v_id := to_jsonb(new) ->> 'id';
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, old_data, new_data)
  values (auth.uid(), 'update', tg_table_name, v_id, v_old_diff, v_new_diff);
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'schools', 'reviews', 'articles', 'article_categories', 'community_posts', 'community_comments',
    'community_categories', 'advertisements', 'users', 'media_files', 'provinces', 'cities'
  ]
  loop
    execute format(
      'create trigger %I after insert or update or delete on public.%I for each row execute function public.log_audit()',
      t || '_audit', t
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Analytics RPCs
-- ---------------------------------------------------------------------------
create or replace function public.track_event(p_type text, p_entity uuid default null, p_lang text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated integer := 0;
begin
  if p_lang is not null and p_lang not in ('kg', 'ru', 'en') then
    p_lang := null;
  end if;

  if p_type = 'school_view' then
    update public.schools set view_count = view_count + 1 where id = p_entity and status = 'published';
    get diagnostics v_updated = row_count;
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
    insert into public.page_events (event_type, entity_id, lang) values (p_type, p_entity, p_lang);
  end if;
end;
$$;

create or replace function public.track_ad_event(p_ad uuid, p_event text, p_lang text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated integer;
begin
  if p_lang is not null and p_lang not in ('kg', 'ru', 'en') then
    p_lang := null;
  end if;

  if p_event = 'impression' then
    update public.advertisements set impressions = impressions + 1
    where id = p_ad and is_active and starts_at <= now() and (ends_at is null or ends_at > now());
  elsif p_event = 'click' then
    update public.advertisements set clicks = clicks + 1
    where id = p_ad and is_active and starts_at <= now() and (ends_at is null or ends_at > now());
  else
    return;
  end if;
  get diagnostics v_updated = row_count;

  if v_updated > 0 then
    insert into public.page_events (event_type, entity_id, lang)
    values (case p_event when 'impression' then 'ad_impression' else 'ad_click' end, p_ad, p_lang);
  end if;
end;
$$;

grant execute on function public.track_event(text, uuid, text) to anon, authenticated;
grant execute on function public.track_ad_event(uuid, text, text) to anon, authenticated;

create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'schools_published', (select count(*) from public.schools where status = 'published'),
    'schools_draft', (select count(*) from public.schools where status <> 'published'),
    'users_total', (select count(*) from public.users),
    'users_week', (select count(*) from public.users where created_at > now() - interval '7 days'),
    'reviews_pending', (select count(*) from public.reviews where status = 'pending'),
    'reviews_published', (select count(*) from public.reviews where status = 'published'),
    'posts_pending', (select count(*) from public.community_posts where status = 'pending'),
    'posts_published', (select count(*) from public.community_posts where status = 'published'),
    'flagged_items', (
      (select count(*) from public.reviews where is_flagged) +
      (select count(*) from public.community_posts where is_flagged) +
      (select count(*) from public.community_comments where is_flagged)
    ),
    'articles_published', (select count(*) from public.articles where status = 'published'),
    'ads_active', (select count(*) from public.advertisements
                    where is_active and starts_at <= now() and (ends_at is null or ends_at > now())),
    'views_7d', (select count(*) from public.page_events
                  where event_type in ('school_view', 'article_view', 'post_view') and created_at > now() - interval '7 days'),
    'searches_7d', (select count(*) from public.page_events where event_type = 'search' and created_at > now() - interval '7 days')
  );
end;
$$;

create or replace function public.admin_daily_events(p_days integer default 30)
returns table (day date, event_type text, total bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
    select (e.created_at at time zone 'Asia/Bishkek')::date as day, e.event_type, count(*)::bigint
    from public.page_events e
    where e.created_at > now() - make_interval(days => greatest(1, least(p_days, 365)))
    group by 1, 2
    order by 1;
end;
$$;

create or replace function public.translation_coverage()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_result jsonb := '{}'::jsonb;
  v_lang text;
begin
  if not public.is_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  foreach v_lang in array array['kg', 'ru', 'en']
  loop
    v_result := v_result || jsonb_build_object(v_lang, jsonb_build_object(
      'schools_total', (select count(*) from public.schools),
      'schools_name', (select count(*) from public.schools where coalesce(name ->> v_lang, '') <> ''),
      'schools_about', (select count(*) from public.schools where coalesce(about ->> v_lang, '') <> ''),
      'articles_total', (select count(*) from public.articles),
      'articles_title', (select count(*) from public.articles where coalesce(title ->> v_lang, '') <> ''),
      'articles_body', (select count(*) from public.articles where coalesce(body ->> v_lang, '') <> '')
    ));
  end loop;
  return v_result;
end;
$$;

revoke execute on function public.admin_dashboard_stats() from public, anon;
revoke execute on function public.admin_daily_events(integer) from public, anon;
revoke execute on function public.translation_coverage() from public, anon;
grant execute on function public.admin_dashboard_stats() to authenticated;
grant execute on function public.admin_daily_events(integer) to authenticated;
grant execute on function public.translation_coverage() to authenticated;
