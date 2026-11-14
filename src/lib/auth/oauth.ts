import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { LEGAL_VERSION } from "@/lib/company";
import { safeNextPath } from "@/lib/constants";
import { LANGS } from "@/lib/i18n/config";

export const OAUTH_CONSENT_COOKIE = "edumaps-oauth-consent";
export const OAUTH_CONSENT_MAX_AGE = 10 * 60;
export const oauthInputSchema = z.object({
  provider: z.enum(["google", "apple"]),
  lang: z.enum(LANGS),
  next: z.string().max(2048).optional(),
  consent: z.literal(true, { message: "consent_required" }),
});

const consentSchema = oauthInputSchema.omit({ consent: true }).extend({
  next: z.string(),
  origin: z.string().url(),
  nonce: z.string().regex(/^[a-f0-9]{48}$/),
  acceptedAt: z.number().int().positive(),
  version: z.literal(LEGAL_VERSION),
});
export type OAuthConsent = z.infer<typeof consentSchema>;

/** Never build a provider redirect from an arbitrary forwarded host/protocol. */
export function authOrigin(requestHeaders: Pick<Headers, "get">): string {
  const host = requestHeaders.get("host");
  if (host && /^(localhost|127\.0\.0\.1)(:\d{1,5})?$/.test(host)) {
    const local = new URL(`http://${host}`);
    return local.origin;
  }
  const configured = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3100");
  if (configured.username || configured.password || configured.pathname !== "/" || configured.search || configured.hash ||
    (configured.protocol !== "https:" && !(configured.protocol === "http:" && ["localhost", "127.0.0.1"].includes(configured.hostname)))) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be a trusted site origin.");
  }
  return configured.origin;
}

/** Resolve as well as checking the string: URL parsing ignores some control characters. */
export function safeOAuthNext(next: string | null | undefined, fallback: string, origin: string): string {
  if (!next || /[\u0000-\u0020\u007f]/.test(next)) return fallback;
  const path = safeNextPath(next, fallback);
  try {
    const target = new URL(path, origin);
    return target.origin === origin ? `${target.pathname}${target.search}${target.hash}` : fallback;
  } catch {
    return fallback;
  }
}

function signingKey(): string {
  const secret = process.env.OAUTH_STATE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || secret.length < 32) throw new Error("OAuth requires OAUTH_STATE_SECRET or SUPABASE_SERVICE_ROLE_KEY.");
  return secret;
}

export function signOAuthConsent(input: z.infer<typeof oauthInputSchema>, origin: string): { value: string; consent: OAuthConsent } {
  const consent: OAuthConsent = { ...input, origin, next: input.next ?? "/", nonce: randomBytes(24).toString("hex"), acceptedAt: Date.now(), version: LEGAL_VERSION };
  const payload = Buffer.from(JSON.stringify(consent)).toString("base64url");
  const signature = createHmac("sha256", signingKey()).update(payload).digest("base64url");
  return { value: `${payload}.${signature}`, consent };
}

/** The callback only accepts consent created by this server for this browser and flow. */
export function readOAuthConsent(value: string | undefined, nonce: string | null, origin: string): OAuthConsent | null {
  if (!value || value.length > 6000 || !nonce) return null;
  try {
    const [payload, signature, extra] = value.split(".");
    if (!payload || !signature || extra) return null;
    const expected = createHmac("sha256", signingKey()).update(payload).digest();
    const actual = Buffer.from(signature, "base64url");
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
    const parsed = consentSchema.safeParse(JSON.parse(Buffer.from(payload, "base64url").toString("utf8")));
    if (!parsed.success) return null;
    const consent = parsed.data;
    const age = Date.now() - consent.acceptedAt;
    if (age < 0 || age > OAUTH_CONSENT_MAX_AGE * 1000 || consent.nonce !== nonce || consent.origin !== origin) return null;
    return consent;
  } catch {
    return null;
  }
}
