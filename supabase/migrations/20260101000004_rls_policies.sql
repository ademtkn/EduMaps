-- Row level security. Public visitors read published content only; members write their own
-- content (always entering moderation); staff moderate; admins manage everything.

do $$
declare
  t text;
begin
  foreach t in array array[
    'provinces', 'cities', 'users', 'profiles', 'languages', 'schools', 'school_locations',
    'school_languages', 'school_programs', 'school_facilities', 'school_media', 'school_faqs',
    'reviews', 'review_votes', 'article_categories', 'articles', 'favorites', 'community_categories',
    'community_posts', 'community_comments', 'content_reports', 'advertisements', 'audit_logs',
    'page_events', 'media_files'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end;
$$;

-- Geography and languages: public read, admin write
create policy provinces_read on public.provinces for select using (true);
create policy provinces_admin on public.provinces for all using (public.is_admin()) with check (public.is_admin());
create policy cities_read on public.cities for select using (true);
create policy cities_admin on public.cities for all using (public.is_admin()) with check (public.is_admin());
create policy languages_read on public.languages for select using (true);
create policy languages_admin on public.languages for all using (public.is_admin()) with check (public.is_admin());

-- Users and profiles
create policy users_read on public.users for select using (id = auth.uid() or public.is_admin());
create policy users_admin_update on public.users for update using (public.is_admin()) with check (public.is_admin());
create policy profiles_read on public.profiles for select using (true);
create policy profiles_update on public.profiles for update
  using ((user_id = auth.uid() and public.is_active_user()) or public.is_admin())
  with check ((user_id = auth.uid() and public.is_active_user()) or public.is_admin());

-- Schools and their child tables
create policy schools_read on public.schools for select using (status = 'published' or public.is_admin());
create policy schools_admin on public.schools for all using (public.is_admin()) with check (public.is_admin());

do $$
declare
  t text;
begin
  foreach t in array array[
    'school_locations', 'school_languages', 'school_programs', 'school_facilities', 'school_media', 'school_faqs'
  ]
  loop
    execute format(
      'create policy %I on public.%I for select using (
         public.is_admin() or exists (select 1 from public.schools s where s.id = school_id and s.status = ''published'')
       )', t || '_read', t
    );
    execute format(
      'create policy %I on public.%I for all using (public.is_admin()) with check (public.is_admin())',
      t || '_admin', t
    );
  end loop;
end;
$$;

-- Reviews
create policy reviews_read on public.reviews for select
  using (status = 'published' or user_id = auth.uid() or public.is_staff());
create policy reviews_insert on public.reviews for insert
  with check (
    user_id = auth.uid()
    and public.is_active_user()
    and exists (select 1 from public.schools s where s.id = school_id and s.status = 'published')
  );
create policy reviews_update on public.reviews for update
  using ((user_id = auth.uid() and public.is_active_user()) or public.is_staff())
  with check ((user_id = auth.uid() and public.is_active_user()) or public.is_staff());
create policy reviews_delete on public.reviews for delete
  using (user_id = auth.uid() or public.is_staff());

create policy review_votes_read on public.review_votes for select using (user_id = auth.uid() or public.is_staff());
create policy review_votes_insert on public.review_votes for insert
  with check (
    user_id = auth.uid()
    and public.is_active_user()
    and exists (
      select 1 from public.reviews r
      where r.id = review_id and r.status = 'published' and r.user_id <> auth.uid()
    )
  );
create policy review_votes_update on public.review_votes for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy review_votes_delete on public.review_votes for delete using (user_id = auth.uid());

-- Education hub
create policy article_categories_read on public.article_categories for select using (true);
create policy article_categories_admin on public.article_categories for all
  using (public.is_admin()) with check (public.is_admin());
create policy articles_read on public.articles for select using (status = 'published' or public.is_admin());
create policy articles_admin on public.articles for all using (public.is_admin()) with check (public.is_admin());

-- Favorites
create policy favorites_own_read on public.favorites for select using (user_id = auth.uid());
create policy favorites_own_insert on public.favorites for insert
  with check (user_id = auth.uid() and public.is_active_user());
create policy favorites_own_delete on public.favorites for delete using (user_id = auth.uid());

-- Community
create policy community_categories_read on public.community_categories for select using (true);
create policy community_categories_admin on public.community_categories for all
  using (public.is_admin()) with check (public.is_admin());

create policy posts_read on public.community_posts for select
  using (status = 'published' or user_id = auth.uid() or public.is_staff());
create policy posts_insert on public.community_posts for insert
  with check (user_id = auth.uid() and public.is_active_user());
create policy posts_update on public.community_posts for update
  using ((user_id = auth.uid() and public.is_active_user()) or public.is_staff())
  with check ((user_id = auth.uid() and public.is_active_user()) or public.is_staff());
create policy posts_delete on public.community_posts for delete
  using (user_id = auth.uid() or public.is_staff());

create policy comments_read on public.community_comments for select
  using (
    public.is_staff()
    or user_id = auth.uid()
    or (
      status = 'published'
      and exists (select 1 from public.community_posts p where p.id = post_id and p.status = 'published')
    )
  );
create policy comments_insert on public.community_comments for insert
  with check (
    user_id = auth.uid()
    and public.is_active_user()
    and exists (select 1 from public.community_posts p where p.id = post_id and p.status = 'published')
  );
create policy comments_update on public.community_comments for update
  using (public.is_staff()) with check (public.is_staff());
create policy comments_delete on public.community_comments for delete
  using (user_id = auth.uid() or public.is_staff());

create policy reports_insert on public.content_reports for insert
  with check (reporter_id = auth.uid() and public.is_active_user());
create policy reports_staff_read on public.content_reports for select using (public.is_staff());
create policy reports_staff_update on public.content_reports for update
  using (public.is_staff()) with check (public.is_staff());
create policy reports_staff_delete on public.content_reports for delete using (public.is_staff());

-- Advertising: the public may only see live campaigns
create policy ads_public_read on public.advertisements for select
  using (
    (is_active and starts_at <= now() and (ends_at is null or ends_at > now()))
    or public.is_admin()
  );
create policy ads_admin on public.advertisements for all using (public.is_admin()) with check (public.is_admin());

-- Operational tables
create policy audit_logs_admin_read on public.audit_logs for select using (public.is_admin());
create policy page_events_staff_read on public.page_events for select using (public.is_staff());
create policy media_files_admin on public.media_files for all using (public.is_admin()) with check (public.is_admin());

-- Table privileges: the API roles get DML and RLS decides which rows. Anonymous visitors are read-only.
revoke all on all tables in schema public from anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on
  public.provinces, public.cities, public.languages, public.profiles, public.users,
  public.schools, public.school_locations, public.school_languages, public.school_programs,
  public.school_facilities, public.school_media, public.school_faqs, public.reviews, public.review_votes,
  public.article_categories, public.articles, public.favorites, public.community_categories,
  public.community_posts, public.community_comments, public.content_reports, public.advertisements,
  public.media_files
to authenticated;
revoke select on public.users, public.audit_logs, public.page_events, public.content_reports,
  public.favorites, public.review_votes, public.media_files from anon;
revoke insert, delete on public.users from authenticated;

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('media', 'media', true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml']),
  ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy media_public_read on storage.objects for select using (bucket_id = 'media');
create policy media_admin_insert on storage.objects for insert
  with check (bucket_id = 'media' and public.is_admin());
create policy media_admin_update on storage.objects for update
  using (bucket_id = 'media' and public.is_admin());
create policy media_admin_delete on storage.objects for delete
  using (bucket_id = 'media' and public.is_admin());

create policy avatars_public_read on storage.objects for select using (bucket_id = 'avatars');
create policy avatars_own_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text and public.is_active_user());
create policy avatars_own_update on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_own_delete on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
