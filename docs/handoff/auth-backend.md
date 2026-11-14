> Historical helper checkpoint. Root subsequently applied migrations22/23, completed implementation, and passed production build, npmtest, and all30 relevant browser cases across runs. See README.md Currentcheckpoint for lateststatus. Real provider credentials are still external prerequisites.

# Auth backend checkpoint

Checkpoint: 10 November 2026, Asia/Bishkek. Work paused by parent for the city school research task. No commits made.

## Files owned and changed

- `src/lib/actions/auth.ts`: username/email login remains; registration now fails closed if username availability RPC errors and rechecks availability after signup errors to identify concurrent username conflicts. OAuth action input is runtime validated and requires `{ provider: "google" | "apple", lang: "kg" | "ru" | "en", next?: string, consent: true }`. Existing return interface `{ ok, data?: { url?: string, unavailable?: boolean } }` preserved. Disabled providers return unavailable. OAuth redirect uses trusted configured origin or safe loopback host, signed consent cookie, per-flow nonce, and SSR PKCE client.
- `src/lib/supabase/admin.ts`: `emailForUsername()` catches absent service key, failed RPC, and network exceptions, returning null rather than crashing or revealing an email.
- NEW `src/lib/auth/oauth.ts`: `authOrigin`, `safeOAuthNext`, `oauthInputSchema`, `signOAuthConsent`, `readOAuthConsent`, cookie constants. HMAC SHA256 signed HttpOnly consent cookie expires after 10 minutes, binds nonce, origin, language, next path and legal version. Signing key is `OAUTH_STATE_SECRET || SUPABASE_SERVICE_ROLE_KEY`, minimum 32 characters. Uses Node crypto and `server-only`.
- `src/app/api/auth/callback/route.ts`: preserves email verification callbacks; OAuth path validates and consumes signed consent before PKCE `exchangeCodeForSession`. Handles denial/error/missing proof, records terms metadata through authenticated `updateUser`, sets preferred profile language for first social signup, preserves safe next path. Errors redirect to localized login with `error=oauth`, `oauth_cancelled`, or `oauth_consent`. Redirect responses use no-store. Arbitrary forwarded host/proto are not trusted.
- `supabase/config.toml`: Google and Apple both disabled; environment-backed `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID`, `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET`, `SUPABASE_AUTH_EXTERNAL_APPLE_CLIENT_ID`, `SUPABASE_AUTH_EXTERNAL_APPLE_SECRET`. Google nonce checks remain enabled.
- NEW `supabase/migrations/20260101000022_username_guards.sql`: serializes username allocation/renames with transaction advisory lock; rejects reserved/invalid/taken explicitly requested handles; generated handles skip reserved names and existing conflicts. Renames existing reserved handles to free suffixed variants, keeping email login intact. Adds profile trigger guard; tightens `username_available`. Adds authenticated-only `user_has_password()` capability for caller's `auth.users.encrypted_password` (no UID parameter). Adds recent signed OAuth AMR requirement (numeric timestamp within past 600 seconds, never future) to direct `delete_my_account()` RPC for accounts without a password.
- `src/lib/database.types.ts`: adds `user_has_password` RPC type alongside Claude's earlier username/RPC additions.
- `supabase/migrations/20260101000021_usernames_social_login.sql`: preexisting uncommitted Claude migration; NOT edited by this agent. Parent reported it already applied locally.

## Migration state

Migration 22 is **written but NOT APPLIED or SQL-validated** by this agent. Parent reported migration 21 already applied locally; this agent could not independently verify ledger.

`./node_modules/.bin/supabase migration list --local` failed sandbox write to `/Users/ademtknmac/.supabase/telemetry.json.tmp...`. Escalated rerun was interrupted while approval was pending; no migration output/result and no known migration process started. A saved prefix approval now exists for `["./node_modules/.bin/supabase", "migration"]`.

Next database steps (no reset or seed):

```sh
./node_modules/.bin/supabase migration list --local
./node_modules/.bin/supabase migration up --local
```

Inspect list first; apply only expected pending migration(s). If 21 was applied directly via SQL without ledger entry, reconcile before running migration up, since migration 21 is not idempotent. Migration22 uses CREATE OR REPLACE / DROP TRIGGER IF EXISTS and repeatable reserved-name cleanup.

## Checks and processes

- PASS `./node_modules/.bin/tsc --noEmit --incremental false` (session 90533 completed exit 0 after peer agents updated their owned files).
- PASS `./node_modules/.bin/eslint src/lib/actions/auth.ts src/lib/supabase/admin.ts src/lib/auth/oauth.ts src/app/api/auth/callback/route.ts` (session 68480 completed exit 0).
- No server started or owned by this agent. Parent owns running local app.
- `docker ps` without escalation failed Docker socket access. `ps` denied by sandbox; no independent full process inventory available.
- No E2E, database security suite, production build or live social-provider flow run by this agent.
- Peer auth_tests_docs agent added `scripts/test-auth.ts`, `e2e/auth.spec.ts`, and updated docs/E2E helpers; their status/results must be obtained separately.

## Unresolved review/verification items

1. Apply and validate migration22; exercise registration duplicate race, reserved-name direct API rejection, profile rename, username lookup grants, `user_has_password` grants and recent OAuth deletion guard. No database reset/seed needed.
2. Callback catches unexpected exceptions after successful PKCE exchange, but does not sign out inside the broad catch. Explicit consent/profile update error branches do sign out. Consider tracking the client/session and signing out on any exception after exchange to ensure failure clears authenticated cookies.
3. Test whether Next.js `cookies().set` in server actions/route handler carries both PKCE/session and consent cookies correctly through redirects; implementation follows official Supabase SSR docs, but successful external provider flow remains untested because credentials are absent.
4. Callback `updateUser` terms metadata is user metadata, consistent with existing email registration. It is not an immutable legal audit log. Signed consent proof protects this app callback flow; direct Supabase signup is governed by Supabase's public signup behavior.
5. `authOrigin` ignores arbitrary forwarded headers and permits only exact loopback hosts from `Host`; production uses `NEXT_PUBLIC_SITE_URL`. Missing production site env currently falls back to localhost3100, yielding unavailable/wrong callback rather than reflecting hostile host. Review desired deployment failure behavior.
6. Supabase env-backed disabled client IDs may produce missing-env warnings during CLI config parsing; verify local startup still succeeds without credentials.
7. `src/lib/database.types.ts` includes caller-used RPCs but not internal helper functions `username_reserved` / `guard_profile_username`; regeneration would add these and reflect nullable unauthenticated `user_has_password` result more precisely. Current caller handles boolean/null fail closed.
8. Root and claude_history agent coordinated account handling: account layer uses verified getClaims AMR (matching user id), Google/Apple identity and recent oauth timestamp. DB guard only checks signed JWT oauth AMR, supporting the same provider authentication requirement. Root owns UI/dictionary callbacks mapping `dict.auth.oauthError`, `oauthCancelled`, `oauthConsentRequired`.

Official sources consulted: https://supabase.com/docs/guides/auth/social-sign-in/auth-google and https://supabase.com/docs/guides/auth/sessions/pkce-flow (SSR PKCE code exchange and cookie behavior); https://supabase.com/docs/guides/local-development/managing-config (env references in config).
