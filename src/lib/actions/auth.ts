"use server";

import { headers } from "next/headers";
import { LEGAL_VERSION } from "@/lib/company";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import { sanitizeLine } from "@/lib/security/sanitize";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema } from "@/lib/validation/schemas";
import { fail, fromZod, type ActionResult } from "./result";

export async function signInAction(input: unknown): Promise<ActionResult<{ invalid?: boolean }>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);

  const ip = clientIp(await headers());
  if (!rateLimit(`login:${ip}:${parsed.data.email}`, 8, 10 * 60_000).ok || !rateLimit(`login-ip:${ip}`, 30, 10 * 60_000).ok) {
    return fail("rate_limited");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ok: true, data: { invalid: true } };
  return { ok: true };
}

export async function signUpAction(input: unknown): Promise<ActionResult<{ needsConfirmation: boolean; emailTaken?: boolean }>> {
  const raw = input as Record<string, unknown> | null;
  const parsed = registerSchema.safeParse(
    raw && typeof raw === "object" ? { ...raw, displayName: typeof raw.displayName === "string" ? sanitizeLine(raw.displayName) : raw.displayName } : input
  );
  if (!parsed.success) return fromZod(parsed.error);
  if (parsed.data.website) return { ok: true, data: { needsConfirmation: false } }; // honeypot: pretend success

  const ip = clientIp(await headers());
  if (!rateLimit(`register:${ip}`, 5, 60 * 60_000).ok) return fail("rate_limited");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        display_name: parsed.data.displayName,
        preferred_lang: parsed.data.lang,
        terms_accepted_at: new Date().toISOString(),
        terms_version: LEGAL_VERSION,
      },
    },
  });
  if (error) {
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
