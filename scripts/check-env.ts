/**
 * Pre-flight check for a production deployment.
 *
 *   npm run check:env            # checks the values in .env.local / the shell
 *   npm run check:env -- --local # also allows localhost (for a local production build)
 *
 * A forgotten NEXT_PUBLIC_SITE_URL is not visible in the interface: canonical links, the sitemap,
 * Open Graph images, the OAuth return address and every e-mailed link would point at the wrong
 * host while the site itself looks fine. This script fails loudly instead.
 */
import { config } from "dotenv";
import path from "node:path";

config({ path: path.resolve(process.cwd(), ".env.local"), quiet: true });
config({ quiet: true });

const allowLocal = process.argv.includes("--local");
const errors: string[] = [];
const warnings: string[] = [];

const env = (key: string) => (process.env[key] ?? "").trim();
const isLocalHost = (value: string) => /^(https?:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])[:/]?/i.test(value) || value === "";

function requireUrl(key: string, { https = true } = {}) {
  const value = env(key);
  if (!value) {
    errors.push(`${key} is missing`);
    return;
  }
  if (!/^https?:\/\//i.test(value)) {
    errors.push(`${key} must start with http:// or https:// (got "${value}")`);
    return;
  }
  if (https && value.startsWith("http://") && !isLocalHost(value)) {
    warnings.push(`${key} is http:// — the site should be served over https`);
  }
  if (isLocalHost(value) && !allowLocal) {
    errors.push(`${key} points at a local address ("${value}"); set the real domain`);
  }
}

requireUrl("NEXT_PUBLIC_SITE_URL");
requireUrl("NEXT_PUBLIC_SUPABASE_URL");

if (!env("NEXT_PUBLIC_SUPABASE_ANON_KEY")) errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing");
if (!env("SUPABASE_SERVICE_ROLE_KEY")) {
  errors.push("SUPABASE_SERVICE_ROLE_KEY is missing — sign-in by username needs it");
}

const mapbox = env("NEXT_PUBLIC_MAPBOX_TOKEN");
if (!mapbox) warnings.push("NEXT_PUBLIC_MAPBOX_TOKEN is empty: the interactive map stays switched off");
else if (!mapbox.startsWith("pk.")) errors.push("NEXT_PUBLIC_MAPBOX_TOKEN must be a public token (pk.…)");

const oauthSecret = env("OAUTH_STATE_SECRET");
if (!oauthSecret) warnings.push("OAUTH_STATE_SECRET is empty: the OAuth consent cookie is signed with the service-role key");
else if (oauthSecret.length < 32) errors.push("OAUTH_STATE_SECRET must be at least 32 characters");

if (!env("NOTIFY_EMAIL_TO")) warnings.push("NOTIFY_EMAIL_TO is empty: the team gets no e-mail about messages or corrections");
if (!env("MAIL_FROM")) warnings.push("MAIL_FROM is empty: notification e-mail is switched off");
if (!env("SMTP_HOST")) warnings.push("SMTP_HOST is empty: notification e-mail is switched off");

for (const key of ["SEED_ADMIN_PASSWORD", "SEED_USER_PASSWORD"]) {
  if (env(key)) warnings.push(`${key} is set; it is only for local seeding and must not exist in production`);
}

for (const message of warnings) console.warn(`  ! ${message}`);
for (const message of errors) console.error(`  ✖ ${message}`);

if (errors.length > 0) {
  console.error(`\n${errors.length} problem(s) found. The site is not ready to deploy.\n`);
  process.exit(1);
}
console.log(`\nEnvironment looks ready${warnings.length ? ` (${warnings.length} warning(s))` : ""}.\n`);
