# Owner spreadsheet import — 10 November 2026

Source: the owner's Google Sheet of Kyrgyz private institutions (`11jjjgBSqDk9BW1WQhmACCqEDUe2v34t5zNpbEFd7XJo`), exported to `data/registry/2026-11-sheet/source.xlsx`. Its "Tüm kurumlar" tab has 907 rows: 296 private schools, 525 kindergartens, 48 colleges and 38 madrasas, each with sources and a check date. 522 rows are also listed in the "Kontrol edilecekler" (to be checked) tab. These are all the Düşük (low) confidence rows plus some Orta (medium) ones. Most are flagged because private status is not confirmed.

## Pipeline

1. `scripts/registry-normalize.py data/registry/2026-11-sheet` turns the sheet into `manifest.json`. It merges rows that share a 2GIS card (907 rows become 896 records), matches schools already on the site (`matches.json` holds the manual matches) and assigns stable slugs. It needs openpyxl. It does not touch the database.
2. `npm run registry:import` runs a dry run. `npm run registry:import -- --apply` writes to local Supabase only (loopback hosts). The run can be repeated: each record's digest is kept in `import-state.json`, and records that have not changed are skipped.
3. Before the first apply, a full public-schema data dump was saved to `backups/public-data-before-import.sql.gz`. Each completed existing school also has a first-touch row backup in `backups/<slug>.json`.

## Rules applied

- **New institutions (864):** stored as `data_status = unverified`. 360 rows that are not in the to-be-checked tab are **published**. 504 to-be-checked rows are **drafts** and appear only in Admin. Kindergartens get grade 0–0. Colleges and madrasas use the `specialized` type with unknown grades. The "international" level maps to `international`.
- **Grades** are set only when "Sınıf / yaş" gives an explicit range. Otherwise the range stays unknown, and the raw text is shown as a "Grades / ages" entry.
- **Taglines** are generated from the type and city. Draft rows use neutral wording ("School" or "Kindergarten" rather than "Private ...") because private status is unconfirmed.
- **English-only facts** (curriculum, highlights, achievements, licence, clubs) become program entries with names in all three languages and English descriptions. Fee text goes in `tuition_notes.en`. No fee amounts were parsed into numbers.
- **Coordinates** come only from 2GIS card coordinates quoted in the sheet notes: 102 records. Rough "geocode ~" side-of-town estimates were ignored. Every other record is listed by address plus its 2GIS link (589 locations have one). 2GIS blocks non-browser access, so no further coordinates were collected and none were invented.
- **New settlements (18)** were created at OpenStreetMap centres. The OSM object for each is in `cities.json`.
- **Existing schools (32 matched):** only empty fields were filled, and researched values were never replaced. The per-school field list is under `filled` in `import-state.json`. Conflicting addresses (Edison, Amir) are listed in `location-conflicts.json`, and their locations were left as researched. Instruction languages are not filled from to-be-checked rows, so Zuura Nurmatova's languages stay unknown, as the research intended.
- Six site schools have no row in the sheet: aim-school, indigo-kids, chudo-chado-bishkek, both Naryn schools, and genius-kg-tokmok. The sheet has no Naryn rows at all.
- The 24 fictional `demo` schools were left untouched.

## Verification

- Dry run and apply passed. A second apply skipped all 896 records.
- After the import there are 420 published schools (396 unverified + 24 demo) and 506 drafts.
- All 1260 public profile pages (420 × kg/ru/en) returned HTTP 200 on `npm start`, port 3100. Drafts return 404, and `/api/health` returns 200.
- `scripts/verify-researched-schools.mjs` now reports the newly filled fields as "mismatches", because it compares against the research manifests, which left those fields empty. This is expected. Check each item against `import-state.json` → `filled`.

## Follow-up of 10 November 2026: verification, demo removal, institution kind

**Region verification.** Six agents checked the 504 draft rows: Bishkek ×2, Osh, Chuy, Issyk-Kul+Talas and Jalal-Abad. The brief is `data/registry/2026-11-sheet/verify/INSTRUCTIONS.md`. Each agent wrote `verify/<region>.json`, holding a verdict, sourced evidence and corrections for every record. Across all 504 records the verdicts were: 338 confirmed, 151 unresolved, 8 not private, 1 closed and 6 duplicates. The importer merges these results:
- Confirmed rows are published.
- Not private, closed and duplicate rows are archived.
- Unresolved rows stay drafts.
- A confirmation that rests only on the 2021 bishkek.adresa-telefony.ru directory, with operating status unknown, also stays a draft (85 Bishkek kindergartens).

Corrections are applied only from sourced agent output. These are phones, websites, Instagram, addresses, grades and instruction languages. The lead's decisions are in `verify-overrides.json`, each with a reason:
- Bishkek's Maarif and Sapat schools count as non-state, consistent with the other regions.
- The Bakai-Ata madrasa gets a corrected 2GIS path.

A data backup taken before this step is in `backups/public-data-before-verification.sql.gz`.

Result: **651 published**, 238 drafts and 13 archived sheet rows. Of the 651 published pages, 1952 of 1953 locale pages returned HTTP 200 on the first pass. The one exception, `kg/dawha-bishkek`, returned 500 because of an anon 3 s statement timeout during the sweep, and returned 200 on retry. Four such timeouts appear in the server log while the full sweep was running. Warm detail queries take 30–130 ms.

Points the owner should review:
- Kaktus reports that **Indigo Sapat** (an existing researched profile, still published), Seitek and Akyltai were transferred to the Ministry of Education in 2025.
- The Anatolian lyceums are archived as state.
- Several Chuy and Bishkek madrasas are confirmed only by the 2GIS "Медресе" rubric.
- Some confirmed entries are development or tutoring centres rather than schools: Munara Bilim (language school), Baalam (speech therapy), Kelechek Jashtary, Strong, Fiksiki and Effekt.
- The Kochkor-Ata, Duldul-Too and Osh regional medical colleges are on the list of private medical colleges ordered closed in 2022. Whether they still operate is unknown.

**Demo schools.** The 24 fictional `demo` schools are now `archived`. Their previous statuses are in `backups/demo-status-before.json`. Their 80 seed reviews and 27 favourites are no longer public. Several e2e specs (public, search, media, mobile, members, import) reference demo slugs and need new fixtures before `npm run test:e2e` can pass again.

**Institution kind.** Migration `20260101000024_institution_kind.sql` adds `schools.institution_kind` (school, kindergarten, college or madrasa). It backfills preschool-only rows as kindergartens and extends `admin_save_school`. The site uses it as follows:
- The directory filter is `?kind=`.
- The map has a kind filter.
- Cards and profiles show a kind badge or fact.
- The Admin form has a kind select.
- The labels are in the KG, RU and EN dictionaries.

Colleges and madrasas from the sheet now use `school_type = private`, and their kind carries the distinction. Typecheck, lint, the i18n check (843 keys × 3) and the production build all passed.

## Open items

- 238 drafts remain: unresolved ownership, plus Bishkek kindergartens confirmed only by 2021 data. The next step is a current 2GIS check or direct contact.
- Collect exact coordinates for the roughly 790 address-only records. This needs browser access to 2GIS or a geocoder the owner approves.
- Rewrite the e2e fixtures that rely on the archived demo schools.
