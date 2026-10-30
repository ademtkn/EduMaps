# EduMaps.kg

Independent school discovery platform for Kyrgyzstan: directory, interactive map, side-by-side comparison, moderated reviews, an Education Hub, a moderated parent community and a full admin console. Trilingual (Kyrgyz default, Russian, English).

> EduMaps.kg is a project developed and operated by **Line.kg**.

Stack: Next.js 15 (App Router, ISR) · TypeScript · Tailwind CSS 4 · Radix/shadcn-style components · Framer Motion · React Hook Form + Zod · Supabase (PostgreSQL, Auth, Storage, RLS) · Mapbox GL.

## Quick start

Requirements: Node 20.9+ (22 recommended), Docker Desktop (running), ~4 GB free RAM.

```bash
npm run setup      # installs deps, starts local Supabase, applies migrations, writes .env.local, seeds demo data
npm run dev        # http://localhost:3100  (or: npm run build && npm start)
```

Open <http://localhost:3100> (redirects to `/kg`). Local Supabase Studio: <http://127.0.0.1:56323>, test inbox: <http://127.0.0.1:56324>.
The project uses its own Supabase ports (56320–56329) so it can run beside other Supabase projects.

### Demo accounts (local only)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@edumap.kg` | `EduMap-Admin-2026!` |
| Moderator | `moderator@edumap.kg` | `EduMap-Admin-2026!` |
| Parent | `aigerim@example.com` (+ 7 more `@example.com`) | `EduMap-Parent-2026!` |

Admin console: <http://localhost:3100/admin> (English UI). Moderators see only Reviews and Community.

### Enabling the interactive map

The map uses Mapbox and needs a free **public** token (`pk.…`) from <https://account.mapbox.com/access-tokens/>:

```bash
# .env.local
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token_here
```

Restart the server. Without a token the map page shows a notice and the school list, filters and every other feature keep working. School pages then offer a Google map that loads only after the visitor presses **Show map**. `npm run setup` preserves an existing token.

Every school page with coordinates also links to **Google Maps** and **2GIS** (plain deep links, no API keys). A fully interactive 2GIS map would need a 2GIS API key and is not built.

## Commands

`npm run start:test` starts the production build with relaxed in-app rate limits (`RATE_LIMIT_SCALE=50`) so the Playwright suite is not throttled. Never use it in production.


| Command | What it does |
|---|---|
| `npm run setup` | Full local bootstrap (see above) |
| `npm run dev` / `build` / `start` | Next.js on port 3100 |
| `npm run db:start` / `db:stop` | Start / stop the local Supabase stack |
| `npm run db:reset` | Re-apply all migrations to an empty database (then `npm run db:seed`) |
| `npm run db:seed` | Wipe and re-create the demo dataset |
| `npm test` | Typecheck + i18n parity + database security checks (33 assertions) |
| `npm run e2e` | Playwright browser tests against a running site (`npm run e2e:install` once) |

## What is included

- **School directory** – search, filters (city, tuition, language, education system, grade, transport, sports, boarding, type), sorting (rating, reviews, name, recently updated), pagination, shareable URLs.
- **School profile** – overview, about, programs, languages, facilities, sports, clubs, tuition, scholarships, transportation, gallery with lightbox, videos (click-to-load YouTube), location, reviews, FAQ, related schools, JSON-LD (`School`, `AggregateRating`, `Review`, `FAQPage`, `BreadcrumbList`).
- **Map** – clustered Mapbox map, live filters, school previews, mobile list/map toggle.
- **Comparison** – up to 4 schools, shareable link, best-value/top-rated highlights.
- **Reviews** – registered users only → *pending* → admin/moderator approval → *published*. Approve/reject/edit/flag, helpful votes, reader reports, ratings recomputed by database trigger.
- **Education Hub** – six categories, articles / guides / videos, Markdown bodies, related reading, save for later.
- **Community** – six moderated topics (posts need approval; replies publish instantly and can be hidden), pinning, reports.
- **Dashboard** – saved schools, saved articles, my reviews (with status and moderator notes), my posts, profile.
- **Admin** – schools (transactional editor with 3-language fields, uploads), reviews, articles, videos, categories, community, advertisements, users and roles/bans, analytics, languages (enable/disable + translation coverage), media library, audit log.
- **School options** – admins manage education systems, facilities (with icons) and languages of instruction at `/admin/options`, with Kyrgyz/Russian/English names, ordering and hide/show; options in use cannot be deleted.
- **Tuition and what it covers** – each school states its fee as the school does (per month, quarter or year, over a 9–12 month school year). A database trigger keeps `tuition_min/max` as the monthly equivalent, so filters, sorting, maps and comparison use one comparable figure, while pages show the school's own price plus “≈ per month” and an estimate per school year. Items such as meals, uniform, transport, clubs, books and stationery are marked included, paid separately (with an optional price and one-time / yearly / monthly) or not stated; the item list is managed at `/admin/options`.
- **Advertising** – internal system (banner, sidebar, featured-article placements), scheduling, language targeting, impression/click counting, always labelled **Advertisement**, never read by any ranking query.
- **Legal and contact** – Privacy Policy, Terms of Use and Community Guidelines in Kyrgyz, Russian and English (`src/lib/legal/`), a contact page with a form that stores messages in `contact_messages` (read them in **Admin → Messages**), and a required consent checkbox at registration. The site shows only the company name and city; the company's registry numbers and address are not displayed and are not kept in the repository (a local, uncommitted `private/registry.json` holds them, and the tests read it to prove they never appear). Bump `LEGAL_VERSION` there when the texts change.
- **Map links** – the school form has a Google Maps and a 2GIS link box under the address. Paste what the apps' Share button gives (long or short links); the link is checked (only those two services are accepted), the coordinates are read from it and filled in, and the form warns when the two links, or a link and the typed numbers, are more than 150 m apart. Visitors then open exactly the links the administrator checked; without links they are built from the coordinates. Short links (maps.app.goo.gl, go.2gis.com) are followed on the server, one redirect at a time and only within those services (`src/lib/map-links*.ts`). CSV import does not carry the links yet; it keeps the ones already saved.
- **School map and directions** – the Location section of a school page opens Google's map by itself when it comes near the screen (no button; the privacy policy says so). With `GOOGLE_MAPS_KEY` set (a browser key restricted to your site in the Google Cloud console; optional `GOOGLE_MAP_ID`) it is a full Google map with a large school-shaped pin; without a key it is Google's embedded map with Google's standard red pin. "Get directions" opens a small menu where the visitor picks Google Maps or 2GIS, and the route opens there. The key is read when the page is built or revalidated, so restart or rebuild after changing it.
- **Plans and advertising pages** – `/for-schools` explains the Basic (free: 2 photos, 1 video) and Pro (10 photos, 5 videos) listings without prices and promises that Pro never affects grades, rankings or search order; `/advertise` lists the four real ad placements, the rules and what an advertiser sends, and links to the contact form (topic "advertising"). Prices are deliberately not published: agree them by email.
- **Search** – the search boxes suggest schools and cities while typing (`/api/search/suggest`, 120 requests per minute per address, published schools only) and are still plain forms without JavaScript. "Schools near me" asks the browser for the location only when pressed, rounds it to about 1 km, carries it as `?near=lat,lng` and sorts by distance (schools without coordinates last); nothing is stored.
- **Team notifications** – an email to the team when a visitor sends a contact message or reports wrong information (`src/lib/notify/team.ts`). It is sent after the submission is saved, so a mail failure never reaches the visitor and the admin console stays the source of truth. Set `NOTIFY_EMAIL_TO` (comma separated), `MAIL_FROM` and `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`; leave them empty to switch it off. Locally the mail catcher receives these at <http://127.0.0.1:56324> (SMTP on port 56325). At most 20 notifications are sent per hour, then one notice that the rest is waiting in the console. Reply-To is the sender, so answering the email answers the visitor. Moderators can handle Messages and Corrections too.
- **Accounts** – password reset by emailed link, password and email change (each asks for the current password), a copy of your data as JSON, and self-service account deletion (removes the account and everything it wrote) under Dashboard → Account. Reset, confirmation and security emails use trilingual templates in `supabase/templates/`; their links land on `/api/auth/callback`. Locally, emails appear in the mail catcher at <http://127.0.0.1:56324>.
- **School day** – opening and closing time and working days (plus notes) per school, shown on cards, school pages and in comparisons.
- **Corrections, no school accounts** – only the EduMaps.kg administrators edit school pages, so every school is treated the same. Every school page has “Report incorrect information”, open to everyone including school staff (who say so and leave an email or phone so the team can verify). Reports arrive in **Admin → Corrections** with the sender's role, contact and source link, and are marked in review, applied or rejected.
- **WhatsApp and interest statistics** – each school can have a WhatsApp number (any common format is accepted and stored as +996…). The button opens a chat that starts with “Hello, I found your school on EduMaps.kg: [link]” in the visitor's language. **Admin → School statistics** shows, per school and with identical measures for all: page views, WhatsApp / phone / email / website / directions presses, shares, comparisons, saves, which sections of the page were reached, how long it stayed open (in ranges), where visits came from and the language. All counters are anonymous (no cookies or identifiers). The site can see that a button was pressed, not whether a message was sent.
- **Home page rotation** – “Discover schools” shows a random selection in which every school has the same chance (no ranking numbers, no “top rated” claim). It holds five schools and one clearly labelled advertisement (placement “Home page: one card among the schools”) at a random position, and refreshes itself every 15 seconds while the visitor is idle: only that section, never the page. It pauses on hover or focus, in a background tab and for visitors who prefer reduced motion, and has Pause and “Show other schools” buttons. The full list stays sortable by rating.
- **What people say about EduMaps.kg** – members send an opinion at `/feedback` (held for review, one per member, deleted with the account); administrators approve it and can add guest opinions in **Admin → Site opinions**, which require a note of how the person gave permission. The home page hides the section until at least one opinion is shown, and sample entries carry a “Demo” badge.
- **Bulk import** – **Admin → Schools → Import from a file** adds or updates many schools from a CSV (Excel or Google Sheets, saved as CSV UTF-8; comma, semicolon and tab separators are detected). Download the template, fill one row per school, upload, read the check (new / update / no change / skipped / errors, with the exact column that is wrong and warnings such as “no coordinates”), then import. Nothing is saved while checking; rows with errors are never saved; every row is validated again with the same rules as the school editor. “Update” changes only the cells that are filled in and never touches photos, programs or questions. **Export all schools** writes the same columns, so a file can be edited and imported back. Up to 300 schools and 2 MB per file; `npm run test:import` covers the parsing rules.
- **Small media** – pictures are shrunk to 1600 px, converted to WebP and stripped of GPS/EXIF on upload (about 95% smaller), with limits of 15 photos, 6 videos and 8 documents per school. Videos live on YouTube and load only after the visitor presses play. Documents are https links to the school's site or a shared drive. `npm run media:optimize` converts older pictures. See [docs/MEDIA.md](docs/MEDIA.md).
- **Brand** – logos and icons in `public/brand/`, `src/app/icon.png`, `apple-icon.png`, `favicon.ico` and `manifest.ts`.
- **SEO** – language-prefixed URLs (`/kg`, `/ru`, `/en`), hreflang alternates, canonical URLs, dynamic metadata and OG images, multilingual sitemap, robots, province / city / education-system landing pages, ISR.

## Security

CSP and hardening headers (`next.config.ts`) · Supabase RLS on every table · moderation state forced by database triggers (clients cannot self-publish, forge counters or change roles) · per-user DB rate limits (3 reviews/posts per 24 h, 20 replies/h) · in-app rate limiting (login, register, uploads, votes, reports, tracking, POST flood in middleware) · spam heuristics (links, repeated characters, blocked words, duplicate content hashing, honeypot fields) · input sanitisation + Zod validation on every action · CSRF: Server Actions origin check + same-origin guard on route handlers · parameterised queries only (PostgREST) · magic-byte image validation · no service-role key in application code (used only by `scripts/seed.ts`) · safe redirect allow-list · ad click redirects read the destination from the database.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Demo data

All seeded content is **fictional** (schools, reviews, people, advertisers use reserved example domains). Photos and logos are generated SVG illustrations so the project runs offline; replace them with real photos through the admin panel. Seed data includes 24 schools in 7 cities, 62 reviews, 8 articles, 16 community posts, 5 ads and 30 days of analytics.

## Known limits

- Rate limiting is in-process memory (correct for one Node instance). Swap `src/lib/security/rate-limit.ts` for Redis/Upstash when scaling horizontally; the database-level limits apply regardless.
- Social login is not built (Supabase Auth supports it). In production, turn on `enable_confirmations` and configure SMTP, otherwise nobody receives reset or confirmation emails.
- The legal texts are written for this site as built, but they are not legal advice. Have a Kyrgyz lawyer review them, and a native speaker review the Kyrgyz versions, before launch.
- The Mapbox map requires your own token and was not exercised against Mapbox's servers in automated tests.
- The admin console is English-only; public content and interface are fully trilingual.
