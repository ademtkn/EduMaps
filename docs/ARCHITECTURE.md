# Architecture

## Layout

```
src/
  app/
    [lang]/…            public site (kg | ru | en). Root layout lives here (sets <html lang>)
    admin/…             admin console, English only, own root layout, role-gated
    api/track|ads|og    view/impression tracking, ad click redirect, OG images
    sitemap.ts robots.ts
  components/           ui (design system) · layout · schools · reviews · education · community · map · compare · ads · admin
  lib/
    i18n/               config, dictionaries (kg/ru/en JSON), localized() fallback, formatting
    supabase/           browser, server (cookies), public (cacheable anon), middleware session refresh
    data/               server-only read models for pages (schools, geo, articles, community, ads)
    actions/            Server Actions: auth, member content, admin
    validation/         Zod schemas shared by forms and actions
    security/           rate limit, sanitisation, spam heuristics, same-origin check
    seo/                metadata + JSON-LD builders
  middleware.ts         language redirect, POST flood guard, session refresh, route gating
supabase/migrations/    schema, triggers, RLS, reference data, admin RPCs
scripts/                seed, setup, DB security test, i18n parity test
e2e/                    Playwright specs
```

## Internationalisation

Every URL starts with `/kg`, `/ru` or `/en` (`kg` is the default and the redirect target for unprefixed URLs; the chosen language is remembered in a cookie). `hreflang` uses `ky`, `ru`, `en` + `x-default`.
Interface strings: `src/lib/i18n/dictionaries/*.json`, typed from `en.json`; `npm run test:i18n` enforces identical keys and placeholders.
Database content: every translatable column is `jsonb {"kg":…,"ru":…,"en":…}` validated by `is_i18n()`. `tr()` resolves a field with a language-aware fallback chain (kg→ru→en, ru→kg→en, en→ru→kg). The admin `I18nField` edits all three languages in one control.

## Data access and caching

- Public pages read through a cookie-less anon client (`lib/supabase/public.ts`) so they are cacheable: `revalidate = 300` (60 s for community), tagged `public-data`. Admin and moderation actions call `revalidateTag("public-data")`.
- User-specific state (session, saved items, own review) is fetched client-side by `AuthProvider` through the browser client under RLS, so pages stay static.
- Writes go through Server Actions (validation → sanitisation → rate limit → RLS-protected insert). The database triggers are the final authority.

## Database

Tables: `users`, `profiles`, `provinces`, `cities`, `languages`, `schools`, `school_locations`, `school_languages`, `school_programs`, `school_facilities`, `school_media`, `school_faqs`, `reviews`, `review_votes`, `favorites`, `article_categories`, `articles`, `community_categories`, `community_posts`, `community_comments`, `content_reports`, `advertisements`, `audit_logs`, `page_events`, `media_files`.

Key behaviours (all in SQL, migrations `…03` and `…04`):

- `handle_new_user` mirrors `auth.users` into `users` + `profiles`; role is never read from client metadata.
- `guard_review` / `guard_post` / `guard_comment` force `pending`, strip forged moderation fields, enforce per-user limits, reject spam and duplicate bodies, and send edited content back to moderation.
- Rating aggregates, helpful counts, reply counts and `has_sports` are maintained by triggers (system-write flag protects counters from client writes).
- `log_audit` records user-attributed changes with a field-level diff.
- RLS: visitors read published content; members write only their own rows; staff moderate; admins manage everything. `admin_save_school(jsonb)` saves a school and all children in one transaction.
- Analytics: `track_event`, `track_ad_event` (security definer, anonymous), `admin_*` RPCs for dashboards.

## Moderation flow

```
member submits → status = pending (forced by trigger)
  → moderator/admin: approve → published (counters update, public cache revalidated)
                      reject  → rejected (note shown to author in dashboard)
                      hide / flag / edit / delete
member edits a published item → back to pending
reader reports → content_reports row → item flagged for staff
```

## Advertising

`advertisements` rows are read only by `getAds()` for display and by admin pages. No ranking, sorting or search query touches that table. Impressions use an IntersectionObserver beacon (once per session), clicks go through `/api/ads/[id]/click`, which reads the destination from the database.
