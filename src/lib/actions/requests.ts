"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { notifyCorrection } from "@/lib/notify/team";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import { sanitizeLine, sanitizeMultiline } from "@/lib/security/sanitize";
import { detectSpam } from "@/lib/security/spam";
import { createClient } from "@/lib/supabase/server";
import { correctionSchema } from "@/lib/validation/schemas";

import { fail, fromDatabaseError, fromZod, type ActionResult } from "./result";

const obj = (input: unknown) => (input && typeof input === "object" ? (input as Record<string, unknown>) : {});
const str = (v: unknown, clean: (s: string) => string) => (typeof v === "string" ? clean(v) : v);

/** Anyone can report wrong information on a school page. An administrator reviews it. */
export async function submitCorrectionAction(input: unknown): Promise<ActionResult> {
  const raw = obj(input);
  const parsed = correctionSchema.safeParse({
    ...raw, message: str(raw.message, sanitizeMultiline), source: str(raw.source, sanitizeLine), name: str(raw.name, sanitizeLine), phone: str(raw.phone, sanitizeLine),
  });
  if (!parsed.success) return fromZod(parsed.error);
  const v = parsed.data;
  if (v.website) return { ok: true };

  if (!rateLimit(`correction:${clientIp(await headers())}`, 8, 60 * 60_000).ok) return fail("rate_limited");
  if (detectSpam(`${v.message} ${v.source}`)) return fail("spam_detected");

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_correction_request", {
    p_school: v.schoolId, p_topic: v.topic, p_message: v.message, p_source: v.source, p_name: v.name, p_email: v.email, p_lang: v.lang, p_role: v.role, p_phone: v.phone,
  });
  if (error) return /not_found|P0002/.test(error.message + (error.code ?? "")) ? fail("not_found") : fromDatabaseError(error);
  after(() => notifyCorrection(v));
  return { ok: true };
}
