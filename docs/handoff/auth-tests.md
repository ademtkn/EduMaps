> Historical helper checkpoint. Root subsequently applied migrations22/23, completed implementation, and passed production build, npmtest, and all30 relevant browser cases across runs. See README.md Currentcheckpoint for lateststatus. Real provider credentials are still external prerequisites.

# Authentication tests and documentation checkpoint

Status: edits written; live E2E execution pending. No commits, resets or seeding performed.

## Files changed

- README.md: added usernames and Google/Apple setup, provider vs site callback guidance, signed consent, server secrets, disabled-provider behavior, account security; replaced outdated social-login/service-key statements.
- .env.example: service key now seed + server username-to-email lookup; optional OAUTH_STATE_SECRET; Google/Apple CLI credential variables and warning that .env.local does not configure Supabase CLI.
- Login selectors now use “Username or email” in account, members, home, import, maplinks, media, outreach and requests E2E specs.
- Registration flows in account/members/home reveal “Continue with email”, fill unique valid usernames and retain consent. Home opinion expectation uses the registered username. Credential errors use the English dictionary.
- New e2e/auth.spec.ts: seven tests cover service-only email lookup; normalized/invalid/reserved username availability; social choices and email-form reveal; duplicate username; case-insensitive login and profile reserved/duplicate/rename persistence; consent/disabled providers; passwordless email-link session refused deletion by UI and direct RPC; unbound forged callback safety.
- New scripts/test-auth.ts: six checks cover consent/provider validation, safe redirects including tab/newline normalization (safeNextPath and safeOAuthNext), trusted origins, valid proof contents, tamper/nonce/origin rejection and proof expiry/future timestamps.

## Checks and processes

- `npx playwright test --list e2e/auth.spec.ts e2e/account.spec.ts e2e/members.spec.ts` passed: 30 tests listed (7 new auth, 9 account, 14 members/admin).
- `git diff --check` passed at first check. Later rerun interrupted; repeat before finishing.
- First `NODE_OPTIONS=--conditions=react-server npx tsx scripts/test-auth.ts` failed with sandbox IPC socket EPERM. Escalated rerun yielded child session ID 89225; result poll interrupted. Root should rerun rather than assume access to this child process handle.
- No live browser E2E tests run yet.

## Pending work

1. Confirm backend migration 20260101000022_username_guards.sql applied and user_has_password plus hardened delete_my_account RPC exist. Backend agent was applying it.
2. Root can add test:auth to package.json (this agent did not own package.json), using `node --conditions=react-server --import tsx scripts/test-auth.ts` or `NODE_OPTIONS=--conditions=react-server tsx scripts/test-auth.ts`; include in aggregate tests if appropriate.
3. Rerun helper checks, typecheck, lint, i18n and diff whitespace check.
4. Restart local app on3100 with RATE_LIMIT_SCALE=50 for E2E. Normal app has registration limit5/hour/IP and login30/10min. Do not reset/seed DB.
5. Run `npx playwright test e2e/auth.spec.ts e2e/account.spec.ts --project=desktop`, then focused member/home registration paths. Auth fixtures create uniquely named disposable local users and clean up only generated IDs.
6. Verify selectors live. Keys now exist: auth.oauthUnavailable, errors.username_taken, username_reserved, reauthentication_required. Profile save labels use dictionary.
7. Unbound access_denied callback intentionally expects oauth_consent: backend verifies signed flow before interpreting cancellation. Real provider success needs credentials; helper tests cover signed proof.
8. Review README against final provider config/account behavior. Google local provider callback is http://127.0.0.1:56321/auth/v1/callback; Apple needs a public domain. Site allowlist uses /api/auth/callback**. Keep all secrets server-only.

Official Supabase Google/Apple social sign-in and redirect URL docs were consulted and linked in README.
