/** Security checks for OAuth redirects and the browser's signed consent proof. No provider credentials needed. */
import assert from "node:assert/strict";
import { safeNextPath } from "../src/lib/constants";
import { authOrigin, OAUTH_CONSENT_MAX_AGE, oauthInputSchema, readOAuthConsent, safeOAuthNext, signOAuthConsent } from "../src/lib/auth/oauth";

process.env.OAUTH_STATE_SECRET = "edumaps-test-only-oauth-proof-secret-32-characters";
const origin = "https://edumaps.example";
const fallback = "/en/dashboard";
let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`  ✔ ${name}`);
}

check("OAuth start requires explicit consent and an allowed provider", () => {
  assert.equal(oauthInputSchema.safeParse({ provider: "google", lang: "en" }).success, false);
  assert.equal(oauthInputSchema.safeParse({ provider: "google", lang: "en", consent: false }).success, false);
  assert.equal(oauthInputSchema.safeParse({ provider: "github", lang: "en", consent: true }).success, false);
});

check("post-login redirects accept only same-site paths", () => {
  for (const candidate of ["//evil.example", "/\\evil.example", "/\n/evil.example", "https://evil.example", "/https:evil.example", "/\t/evil.example"]) {
    assert.equal(safeOAuthNext(candidate, fallback, origin), fallback, candidate);
    assert.equal(safeNextPath(candidate, fallback), fallback, candidate);
  }
  assert.equal(safeOAuthNext("/en/schools?q=test#results", fallback, origin), "/en/schools?q=test#results");
});

check("forwarded hosts cannot choose the OAuth return origin", () => {
  const previous = process.env.NEXT_PUBLIC_SITE_URL;
  process.env.NEXT_PUBLIC_SITE_URL = origin;
  try {
    assert.equal(authOrigin(new Headers({ host: "untrusted.example", "x-forwarded-host": "evil.example", "x-forwarded-proto": "http" })), origin);
    assert.equal(authOrigin(new Headers({ host: "localhost:3100", "x-forwarded-host": "evil.example", "x-forwarded-proto": "https" })), "http://localhost:3100");
    process.env.NEXT_PUBLIC_SITE_URL = "http://public.example";
    assert.throws(() => authOrigin(new Headers({ host: "untrusted.example" })));
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = previous;
  }
});

const proof = signOAuthConsent({ provider: "google", lang: "en", next: "/en/dashboard?tab=account", consent: true }, origin);
check("valid consent retains the selected provider, language and destination", () => {
  const consent = readOAuthConsent(proof.value, proof.consent.nonce, origin);
  assert.equal(consent?.provider, "google");
  assert.equal(consent?.lang, "en");
  assert.equal(consent?.next, "/en/dashboard?tab=account");
});

check("missing, tampered or cross-browser consent is rejected", () => {
  assert.equal(readOAuthConsent(undefined, proof.consent.nonce, origin), null);
  assert.equal(readOAuthConsent(proof.value, null, origin), null);
  assert.equal(readOAuthConsent(proof.value, "a".repeat(48), origin), null);
  assert.equal(readOAuthConsent(proof.value, proof.consent.nonce, "https://other.example"), null);
  const [payload, signature] = proof.value.split(".");
  assert.equal(readOAuthConsent(`${payload.slice(0, -1)}A.${signature}`, proof.consent.nonce, origin), null);
  assert.equal(readOAuthConsent(`${payload}.bad-signature`, proof.consent.nonce, origin), null);
});

check("expired or future-dated proof is rejected", () => {
  const actualNow = Date.now;
  try {
    Date.now = () => proof.consent.acceptedAt + (OAUTH_CONSENT_MAX_AGE + 1) * 1000;
    assert.equal(readOAuthConsent(proof.value, proof.consent.nonce, origin), null);
    Date.now = () => proof.consent.acceptedAt - 1;
    assert.equal(readOAuthConsent(proof.value, proof.consent.nonce, origin), null);
  } finally {
    Date.now = actualNow;
  }
});

console.log(`\n${passed} OAuth security checks passed.`);
