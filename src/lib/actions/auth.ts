"use server";

import { cookies, headers } from "next/headers";
import { LEGAL_VERSION } from "@/lib/company";
import { authOrigin, OAUTH_CONSENT_COOKIE, OAUTH_CONSENT_MAX_AGE, oauthInputSchema, safeOAuthNext, signOAuthConsent } from "@/lib/auth/oauth";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import { sanitizeLine } from "@/lib/security/sanitize";
import { emailForUsername } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { localizedPath } from "@/lib/i18n/config";
import { loginSchema, registerSchema } from "@/lib/validation/schemas";
import { fail, fromZod, type ActionResult } from "./result";

export async function signInAction(input: unknown): Promise<ActionResult<{ invalid?: boolean }>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);

  const ip = clientIp(await headers());
  const { identifier, password } = parsed.data;
  if (!rateLimit(`login:${ip}:${identifier}`, 8, 10 * 60_000).ok || !rateLimit(`login-ip:${ip}`, 30, 10 * 60_000).ok) {
    return fail("rate_limited");
  }

  // A username is turned into its email first. An unknown username answers exactly like a wrong password.
  const email = identifier.includes("@") ? identifier : await emailForUsername(identifier);
  if (!email) return { ok: true, data: { invalid: true } };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: true, data: { invalid: true } };
  return { ok: true };
}

export async function signUpAction(input: unknown): Promise<ActionResult<{ needsConfirmation: boolean; emailTaken?: boolean }>> {
  const raw = input as Record<string, unknown> | null;
  const parsed = registerSchema.safeParse(
    raw && typeof raw === "object" ? { ...raw, username: typeof raw.username === "string" ? sanitizeLine(raw.username) : raw.username } : input
  );
  if (!parsed.success) return fromZod(parsed.error);
  if (parsed.data.website) return { ok: true, data: { needsConfirmation: false } }; // honeypot: pretend success

  const ip = clientIp(await headers());
  if (!rateLimit(`register:${ip}`, 5, 60 * 60_000).ok) return fail("rate_limited");

  const supabase = await createClient();
  const { data: free, error: availabilityError } = await supabase.rpc("username_available", { p_username: parsed.data.username });
  if (availabilityError) return fail("unknown");
  if (free === false) return fail("validation", { username: "username_taken" });

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        username: parsed.data.username,
        display_name: parsed.data.username,
        preferred_lang: parsed.data.lang,
        terms_accepted_at: new Date().toISOString(),
        terms_version: LEGAL_VERSION,
      },
    },
  });
  if (error) {
    // A second member may take the name between checking it and creating the account.
    // Auth intentionally hides the trigger's database error; check availability again.
    const { data: stillFree } = await supabase.rpc("username_available", { p_username: parsed.data.username });
    if (stillFree === false) return fail("validation", { username: "username_taken" });
    if (/already|registered|exists/i.test(error.message)) return { ok: true, data: { needsConfirmation: false, emailTaken: true } };
    if (error.status === 429) return fail("rate_limited");
    return fail("unknown");
  }
  // Supabase returns a user with no identities when the email is already registered (enumeration protection).
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return { ok: true, data: { needsConfirmation: false, emailTaken: true } };
  }
  return { ok: true, data: { needsConfirmation: !data.session } };
}

export type OAuthProvider = "google" | "apple";

/** Is the provider switched on in Supabase Auth? Lets the form say so instead of showing a raw error page. */
async function providerEnabled(provider: OAuthProvider) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return false;
    const res = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key }, cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (!res.ok) return false;
    const settings = (await res.json()) as { external?: Record<string, boolean> };
    return settings.external?.[provider] === true;
  } catch {
    return false;
  }
}

/** Starts "Continue with Google / Apple". Returns the provider's sign-in address for the browser to open. */
export async function startOAuthAction(input: unknown): Promise<ActionResult<{ url?: string; unavailable?: boolean }>> {
  const parsed = oauthInputSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const { provider, lang } = parsed.data;
  if (!rateLimit(`oauth:${clientIp(await headers())}`, 30, 10 * 60_000).ok) return fail("rate_limited");
  if (!(await providerEnabled(provider))) return { ok: true, data: { unavailable: true } };

  try {
    const origin = authOrigin(await headers());
    const next = safeOAuthNext(parsed.data.next, localizedPath(lang, "/dashboard"), origin);
    const { value, consent } = signOAuthConsent({ ...parsed.data, next }, origin);
    const callback = new URL("/api/auth/callback", origin);
    callback.searchParams.set("lang", lang);
    callback.searchParams.set("flow", consent.nonce);

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: callback.toString(), skipBrowserRedirect: true },
    });
    if (error || !data.url) return fail("unknown");
    (await cookies()).set(OAUTH_CONSENT_COOKIE, value, {
      httpOnly: true, sameSite: "lax", secure: origin.startsWith("https:"), path: "/api/auth/callback", maxAge: OAUTH_CONSENT_MAX_AGE,
    });
    return { ok: true, data: { url: data.url } };
  } catch {
    return { ok: true, data: { unavailable: true } };
  }
}
