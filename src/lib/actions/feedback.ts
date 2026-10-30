"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { rateLimit } from "@/lib/security/rate-limit";
import { sanitizeMultiline } from "@/lib/security/sanitize";
import { detectSpam } from "@/lib/security/spam";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { feedbackSchema } from "@/lib/validation/schemas";
import { fail, fromDatabaseError, fromZod, type ActionResult } from "./result";
import { getMember } from "./session";

/** A signed-in member sends their opinion of EduMaps.kg. It is held until the team has read it. */
export async function submitTestimonialAction(input: unknown): Promise<ActionResult> {
  const raw = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const parsed = feedbackSchema.safeParse({ ...raw, quote: typeof raw.quote === "string" ? sanitizeMultiline(raw.quote) : raw.quote });
  if (!parsed.success) return fromZod(parsed.error);
  const v = parsed.data;
  if (v.website) return { ok: true };

  const member = await getMember();
  if (!member) return fail("unauthenticated");
  if (!rateLimit(`testimonial:${member.user.id}`, 6, 24 * 60 * 60_000).ok) return fail("rate_limited");
  if (detectSpam(v.quote)) return fail("spam_detected");

  const dict = await getDictionary(v.lang);
  const title = v.role ? dict.feedback.roles[v.role] : "";
  const { error } = await member.supabase.rpc("submit_site_testimonial", { p_quote: v.quote, p_lang: v.lang, p_title: title });
  if (error) return fromDatabaseError(error);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteMyTestimonialAction(): Promise<ActionResult> {
  const member = await getMember();
  if (!member) return fail("unauthenticated");
  const { error } = await member.supabase.from("site_testimonials").delete().eq("user_id", member.user.id);
  if (error) return fromDatabaseError(error);
  revalidateTag("public-data");
  return { ok: true };
}
