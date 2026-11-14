# EduMaps handoff — 15 November 2026

## Standing decision (15 Nov 2026)

EduMapsYapim (`~/Desktop/WEBSITES/EduMapsYapim`, live at edumaps.kg) will **not** be developed
further. It stays as the data-collection front (school applications, outreach). Everything moves to
this Next.js app, which is to be finished locally and then published. Do not add features to the
other repository; when data is needed from it, export it and import it here.

## Current checkpoint

See [schools-status.md](schools-status.md) for the generated per-institution gaps and [data-audit.md](data-audit.md) for the independent audit. `CLAUDE.md` at repository root points here automatically.

### 15 Nov 2026 — first public-surface cleanup (before any feature work)

The local database was inspected for the first time since the import. Numbers a visitor can see:
**651 published** schools (238 draft, 37 archived), of which **619 have neither a cover nor a logo**,
**105 have coordinates** and **one** has a fee. Nothing is `verified`.

- Sample content removed from the public site: all eight sample advertisements deactivated (only the
  rows changed, no delete), the 15 seeded community posts set to `hidden`, the "EduMaps.kg is live"
  article set to `draft`. The 80 seeded reviews belong to archived sample schools and are no longer
  counted.
- `getSiteStats` now counts only what a visitor can reach: reviews on published schools and cities
  that hold at least one published school. The reviews tile stays hidden below 10 reviews.
- Home page: cities with no published school are hidden, the eight busiest are shown, and the hero
  shortcuts use the same order. The "not confirmed" badge and the repeated "on request" fee line are
  gone from school cards; grades show only when a range is known. See `school-card.tsx`.
- Local sample data was **not** deleted, only unpublished: `npm run db:seed` would bring it back.
  Do not seed without deciding what to do with the eight sample ads and 15 posts.

### 15 Nov 2026 — release blockers

- **Row cap:** PostgREST stops at 1000 rows without an error. `src/lib/data/paging.ts` reads such lists
  page by page and is now used by the sitemap slugs, the map, the comparison picker, the language and
  district filters, the per-city counts, the site statistics and the community sitemap. `npm run
  test:paging` covers the helper (2500 rows, exact page, failing page).
- **Tracking is server-only:** migration 25 revokes `track_event` / `track_ad_event` from `public`,
  `anon` and `authenticated` (PostgreSQL grants EXECUTE to PUBLIC by default) and grants them to
  `service_role`. `/api/track` therefore calls them with the service client; the public key can no
  longer inflate counters past the same-origin check and rate limit.
- **Pre-flight:** `npm run check:env` refuses a localhost `NEXT_PUBLIC_SITE_URL` or Supabase URL, a
  non-`pk.` Mapbox token and a short `OAUTH_STATE_SECRET`, and warns about missing mail settings.
- **Backups:** `npm run db:backup` writes a gzipped `pg_dump` of the public schema plus row counts to
  `backups/` (ignored by git). Restore steps are in `docs/DEPLOYMENT.md`.
- The comment-moderation question is settled by design, not by code: reviews and new posts wait for
  approval, replies inside a post publish immediately and are hidden afterwards. `docs/ARCHITECTURE.md`
  said otherwise and now matches `guard_comment`.

### 15 Nov 2026 — experience and accessibility pass

The owner confirmed on 15 Nov that **the site stays local for now; there is no public launch**. Deployment
items below stay on the shelf until that changes.

- Loading states exist for the directory and the school page (`schools/loading.tsx`,
  `schools/[slug]/loading.tsx`), so a slow query no longer looks like a frozen page.
- Contrast: the "fair" letter grade moved from `warning-500` (2.8:1) to `warning-700`, and input
  placeholders from `ink-400` (2.6:1) to `ink-500`.
- Touch targets: report/correct links are at least 24 px tall, the favourite button is 40 px, and the
  opinion dots have a 24 px hit area around the 8 px dot.
- Heading order: the directory result count is an `h2`, so the card `h3`s no longer skip a level.
- `Pagination` and `Breadcrumbs` take their accessible names from the dictionary instead of the
  hardcoded English "Pagination"/"Breadcrumb" (846 keys × 3 languages).

- All **34 selected institutions** are researched and imported: **33 published**, **Genius.kg Tokmok draft** by explicit owner instruction. An additional historical AIM Balykchy candidate is preserved as a draft, superseded by Birinchi Mugalim in the selected Issyk-Kul batch. Thus import-state has35 historical entries, not35 selected institutions.
- **87 actual sourced image assets** are stored; **28 selected institutions have a logo and two images**. The six incomplete media sets include the intentionally unverified Genius draft; the five published gaps are Happy Kids, Raduga Tokmok, AALAM Tokmok, Amir Tokmok and Diplomat's missing logo. Missing public contacts/programs/teaching languages remain explicit, not invented. Some genuine school video covers are captioned as such.
- Happy Kids uses the most documented Bakaev141 kindergarten listing under the owner's branch-selection preference; it is published as unverified, with current operating status and media gaps disclosed. Indigo West's school identity was resolved; incorrect kindergarten contacts were cleared and independently verified as NULL.
- Authentication implementation is complete and validated. Production build and npm test passed (121 DB checks,52 importer checks after the grade additions,23 media checks,16 map-link checks,6 OAuth helper checks,837 dictionary keys across3 languages). All30 relevant auth/account/member browser cases passed across runs. Real Google/Apple sign-in requires the owner's provider credentials; the disabled-provider UX is verified.
- Final production rebuild passed. Normal `npm start` is running on port3100 (unified-exec session36011), without relaxed test limits. All102 selected locale-page responses passed (99 published HTTP200 pages plus3 Genius draft HTTP404 pages); all87 image endpoints and `/api/health` passed. Verification report: `data/research/2026-11-schools/verification.json`. For further edits, stop this server and use `npm run dev`; do not run build and dev concurrently.
- No commit, push or public deployment was requested or performed. Do not reset or seed the database.

- **10 Nov 2026, spreadsheet import:** the owner's sheet of 907 institutions was imported. See [registry-import.md](registry-import.md). The site now has 420 published schools and 506 drafts. All 1260 public profile pages returned HTTP 200 on `npm start`, port 3100.

## Active user requests

1. Finish Claude's username / Google / Apple authentication work. Implementation is mostly complete; validation and final local restart remain. See `auth-backend.md` and `auth-tests.md` when available. Do not revert existing uncommitted changes.
2. Research and add 34 real private educational institutions to the local site. User accepts kindergartens, primary/secondary schools, lyceums and colleges. Assign one research agent per city, two for Bishkek. Runtime supports three simultaneous helper agents, so the eight assignments run in waves.

## Requested batches

| Assignment | Required | Status |
|---|---:|---|
| Bishkek A — Indigo Sapat, Indigo Academy West, Asylkech, Indigo Prime, Indigo British kindergarten, Indigo Djal kindergarten, Light Academy | 7 | researching |
| Bishkek B — SI, Silk Road, Oxford, Edison, Chudo-Chado, Happy Kids, Intellect Pro, Kelechek MIT | 8 | researching |
| Tokmok — Umut Girls Lyceum, Genius.kg, AALAM, Amir kindergarten, Raduga kindergarten | 5 | researching |
| Issyk-Kul outside Karakol — choose three verified private institutions | 3 | queued |
| Karakol — choose two verified private institutions | 2 | queued |
| Naryn — choose two verified private institutions | 2 | queued |
| Jalal-Abad / Manas — choose five verified private institutions | 5 | queued |
| Talas — choose two verified private institutions | 2 | queued |

## Data and provenance

Research lives in `data/research/2026-11-schools/`. Each assignment maintains a JSON file and a progress Markdown file there. Names/descriptions/addresses may be translated; translations are not claims of official branding. Unknown facts remain null/empty and are listed in `missing`. Distinguish teaching languages from foreign-language subjects, private ownership from a marketing name, and individual branches from a shared network. Never invent coordinates, contacts, programs, logos or photos. Retain direct public source URLs and verification dates for every school and media item.

Local import must be repeatable, preserve unrelated schools and media, and avoid reset/seed. Public data should be marked `unverified` (public sources, not direct institutional confirmation). Download actual school assets when accessible and optimize them; record failures rather than substitute unrelated imagery.

## Local environment

- Next.js site: `http://localhost:3100` (language prefixes `kg`, `ru`, `en`).
- Supabase project `edumap`, API `http://127.0.0.1:56321`, Studio `http://127.0.0.1:56323`, mail viewer `http://127.0.0.1:56324`.
- `.env.local` is configured. Never print its keys. Do not run `npm run setup` or reset/seed: those erase local data.
- Node 22 available at `/Users/ademtknmac/.nvm/versions/node/v22.21.0/bin/node`; shell default currently Node 26.
- Authentication changes and their new migrations are uncommitted. No commits/push/deploy requested.

## Activity log

- Previous turn: site started; homepage and `/api/health` returned HTTP 200. Baseline typecheck exposed Claude's unfinished auth form/schema mismatch.
- Auth implementation: root updated auth UI and EN/RU/KG dictionaries; helpers implemented callback, account/profile handling, migrations and tests. i18n check passed (837 keys × 3). Complete validation still pending at interruption.
- New research request received: created persistent batch directory and this handoff before dispatching research. Issyk-Kul interpreted as the region excluding separately requested Karakol; use actual town for each institution.

- Owner clarification: SI means **QSI**; Genius.kg Tokmok should remain a draft until a Tokmok branch is verified.
- Migration22 applied successfully locally without reset. Added migration23 to represent unknown grades as NULL and preschool as 0–0, avoiding invented grade ranges for researched institutions.
- Manas city name confirmed via Kyrgyz Presidency: https://president.kg/kg/news/21/39594 (17 September 2025 law). Keep existing jalal-abad city slug/links; display current name with former name for discoverability.

- Migration23 applied successfully (second connection attempt). Existing illustrations for specifically imported real institutions will be replaced; backed-up seed database rows remain in research/backups and storage files are not deleted. Import script defaults to dry run and refuses remote Supabase hosts.

- Auth callback catch now signs out a successfully exchanged session if later processing throws. Added npm test:auth and research:import commands. Root importer validates sourced batch JSON, creates/updates only matching schools and their managed children, records backups, copies actual images into local Supabase Storage, and persists import-state.json after every school/asset.

- Resumed after usage limit: existing research files contained 16 records (6 BishkekA,5 BishkekB,5 Tokmok); no import-state existed, so DB import had not run. Restarted new city agents issyk_kul, karakol, jalal_abad. Remaining Naryn/Talas queued; original Bishkek agents must finish Light Academy/Edison/Chudo-Chado/Happy Kids and missing media.
- Fixed research importer runtime top-level-await (CJS) and nullable missing addresses. Dry-run passed16 records,14 publishable. Root initiated initial local import; see import-state.json for per-school progress.
- Previous production build had failed fetching fonts in sandbox. Retried with approved network access after stopping dev; compilation and type validity passed, static page generation underway. Do not run next build concurrently with next dev.
- Auth security helper checks passed6/6; latest standalone typecheck and ESLint passed before resumption. Full auth browser tests still pending.

- Initial import completed16 schools:14 published,2 draft (Genius Tokmok and Indigo Academy West).23 real media assets imported. One Umut HEIC photo failed sharp decoding; importer now includes macOS sips HEIC conversion fallback; retry batch tokmok.
- Production build passed. Started production test server on3100 (session44003; relaxed RATE_LIMIT_SCALE=50). Auth/account/member browser tests:28 passed,1 failed due to test fixture unexpectedly receiving a generated random password from admin.createUser,1 skipped due serial failure. Fixed fixture to create actual passwordless account using signInWithOtp; auth spec rerun pending(session71817).
- Importer now does not claim first language is primary, removes only managed stale research programs, and updates Manas display name while preserving jalal-abad slug. Reapply all completed batches after research is done.

- Latest resume: source JSON progressed to30 records while import read its snapshot; all30 imported successfully (28published,2draft at that moment),64 assets. West exact current school identity subsequently resolved by BishkekA using its own profile and current debate-event source; correcting previously mismatched kindergarten details before publication.

- Resumed again after helper usage limits. Auth finalchecksconfirmed: npmtest passed and the corrected local-only fixture auth E2E7/7 passed; account/member23 cases previously passed. Productiontestserver running3100. Imported30 records with64assets; latestsourceJSON33 records pendingfinalNaryn.
- Talas2 complete withlogos+2photos each. BishkekB8 complete: HappyKids staysdraft until exactcurrentbranchconfirmed; sourceBakaev141 record retained. User clarification requested asynchronously. BishkekAWest actualschool resolved (official @indigo_academy_west, Moskovskaya191a) and beingcorrected/published; no permission needed beyond original userrequest.
- Naryn secondschool continuity confirmed: current private Maarifbranch registered26August2025 after oldentity cessation25August; current campus atLenina97/2. Awaitsecondrecord/assets then importall34.

- Owner preference: when branches/options are ambiguous, choose the branch/institution with the most complete verified information and actual images. Continue without repeated clarification. Apply this to Happy Kids and later city selections, respecting supplied institution names/cities; GeniusTokmok remains draft per prior explicit instruction.

- All34 target records now researched and imported; user branch-selection preference applied to Happy Kids: selected Bakaev141 directory listing, publishable with unverified source wording and explicit current-status/media gaps. Genius remains draft. LatestTokmok enrichment imported sharedAIMnetworklogo;84 managed assets. No active media download failures (one oldUmut error retained in attempt log, asset now present).
- Added meaningful unknown-grade/preschool CSV checks;52 importer checks passed. Latestlint/typecheck passed; admin new-school defaults now leave grade bounds blank rather than invent1–11.

- Data audit caught that null-contact retractions were incorrectly retaining old West kindergarten phone/WhatsApp/email/site. Research importer now treats the requested contact fields as authoritative, clearing wrong old values; unrelated columns/social channels remain preserved. Reimporting BishkekA and verifying exact DB contacts/location.
- Added read-only scripts/verify-researched-schools.mjs: validates34 selected DB profiles, localized names, ownership type, source contacts/locations, grade semantics, public visibility, managed real-image availability and optional102 local-language HTTPpages. VerificationJSON saved with remaining gaps.

- Final audit: West contacts cleared; Birinchi Mugalim published with three verified assets, old AIM candidate retained as draft. Source manifests contain34 selected institutions; current state preserves35 historical rows. A white Intellect logo now receives a dark frame, and wide logos fit without cropping on cards, profiles and comparisons.

- Final verification completed:34 selected institutions,33 published/1 owner-approved draft,28 with logo+two images,87 accessible sourced assets.102 localHTTPpage responses checked acrossKG/RU/EN; no failures. Final build passed, gitdiffcheck clean. Normal production preview `npm start` remains running on3100; `/api/health` HTTP200. HistoricalAIMcandidate is draft and preserved; source selection stays34. All agent research/audit notes and root CLAUDE.md entry point saved.
