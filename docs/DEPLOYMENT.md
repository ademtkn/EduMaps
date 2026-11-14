# Deploying beyond localhost

1. **Supabase project** (hosted or self-hosted). Link with `npx supabase link` and run `npx supabase db push` to apply `supabase/migrations`. Do **not** run the seed script against production (it refuses non-local URLs unless `ALLOW_REMOTE_SEED=1`).
2. **Create the first admin**: sign up through the site, then in the SQL editor: `update public.users set role = 'admin' where email = 'you@example.com';`
3. **Auth settings** (Dashboard → Authentication): set Site URL and redirect URLs to your domain, enable email confirmations, configure SMTP.
4. **Environment** (host such as Vercel, Fly or a container): `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_MAPBOX_TOKEN` and `SUPABASE_SERVICE_ROLE_KEY`. The service-role key
   must stay **server-side only** (never with a `NEXT_PUBLIC_` prefix, never in client code): sign-in by username and
   the two counters behind `/api/track` need it. **Run `npm run check:env` before every deployment** — it refuses a
   localhost `NEXT_PUBLIC_SITE_URL`/`NEXT_PUBLIC_SUPABASE_URL`, a non-`pk.` Mapbox token and a short
   `OAUTH_STATE_SECRET`, and warns about missing mail settings. `npm run check:env -- --local` only makes sense for a
   production build on your own machine.
5. **Images / CSP**: `next.config.ts` derives `remotePatterns` and CSP `connect-src`/`img-src` from `NEXT_PUBLIC_SUPABASE_URL`. Restrict your Mapbox token to your domain.
6. **Build**: `npm run build && npm start` (Node 20.9+). The build prerenders pages from the database, so it must be reachable at build time.
7. **Scaling**: replace the in-memory limiter in `src/lib/security/rate-limit.ts` with Redis/Upstash; run behind a CDN; HSTS is already sent.
8. **Backups & monitoring**: enable Supabase PITR on the hosted project; review `audit_logs` and admin analytics.
   For the local database, `npm run db:backup` writes `backups/edumaps-<stamp>.sql.gz` (public schema, ~1 MB) plus a
   row-count sheet. Files are ignored by git because they contain personal data; keep a copy outside the repository.
   Restore with `gunzip -c backups/<file>.sql.gz | docker exec -i supabase_db_edumap psql -U postgres -d postgres`
   after `npm run db:start`, then re-run `npm run test:db` to prove the security rules survived.

   Nothing monitors the site yet: add uptime checks on `/api/health` and error reporting (for example Sentry) before
   launch, otherwise a failure is only noticed by a parent who cannot open a page.
9. **Media**: see [MEDIA.md](MEDIA.md). Pictures are optimised on upload; plan to move the media bucket to object storage with a CDN (for example DigitalOcean Spaces) once the site is deployed.
10. **Domain**: add the domain registered at cctld.kg to your host. Either keep the DNS at the registrar and add the records your host gives you (an `A` record for the root, `CNAME` for `www`), or point the registrar's nameservers to your DNS provider (for DigitalOcean: `ns1.digitalocean.com`, `ns2.digitalocean.com`, `ns3.digitalocean.com`). Then set `NEXT_PUBLIC_SITE_URL` to the final address.

**Team notifications**: set `NOTIFY_EMAIL_TO`, `MAIL_FROM` and the `SMTP_*` variables on the server (a company address on your own domain is more trusted than a free mailbox, and SPF/DKIM on that domain keep the mail out of spam). Without them nothing is sent and new messages are only in Admin → Messages / Corrections.
