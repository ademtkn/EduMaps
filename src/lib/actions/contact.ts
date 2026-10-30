"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { notifyContactMessage } from "@/lib/notify/team";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import { sanitizeLine, sanitizeMultiline } from "@/lib/security/sanitize";
import { detectSpam } from "@/lib/security/spam";
import { createClient } from "@/lib/supabase/server";
import { contactSchema } from "@/lib/validation/schemas";
import { fail, fromDatabaseError, fromZod, type ActionResult } from "./result";

export async function submitContactAction(input: unknown): Promise<ActionResult> {
  const raw = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const parsed = contactSchema.safeParse({
    ...raw,
    name: typeof raw.name === "string" ? sanitizeLine(raw.name) : raw.name,
    school: typeof raw.school === "string" ? sanitizeLine(raw.school) : raw.school,
    message: typeof raw.message === "string" ? sanitizeMultiline(raw.message) : raw.message,
  });
  if (!parsed.success) return fromZod(parsed.error);
  const v = parsed.data;
  if (v.website) return { ok: true }; // honeypot: pretend success

  const ip = clientIp(await headers());
  if (!rateLimit(`contact:${ip}`, 5, 60 * 60_000).ok) return fail("rate_limited");
  if (detectSpam(`${v.message} ${v.school}`)) return fail("spam_detected");

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_contact_message", {
    p_name: v.name, p_email: v.email, p_topic: v.topic, p_school: v.school, p_message: v.message, p_lang: v.lang,
  });
  if (error) return fromDatabaseError(error);
  after(() => notifyContactMessage(v));
  return { ok: true };
}
