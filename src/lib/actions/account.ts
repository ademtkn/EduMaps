"use server";

import { headers } from "next/headers";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { changeEmailSchema, changePasswordSchema, deleteAccountSchema, forgotPasswordSchema, resetPasswordSchema } from "@/lib/validation/schemas";
import { fail, fromZod, type ActionResult } from "./result";
import { getMember } from "./session";


/** Sends the reset email. The answer is the same whether or not the address has an account. */
export async function requestPasswordResetAction(input: unknown): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  if (parsed.data.website) return { ok: true };

  const ip = clientIp(await headers());
  if (!rateLimit(`reset-ip:${ip}`, 8, 60 * 60_000).ok || !rateLimit(`reset-mail:${parsed.data.email}`, 3, 60 * 60_000).ok) return fail("rate_limited");

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email);
  if (error && error.status === 429) return fail("rate_limited");
  return { ok: true };
}

/** Sets a new password for the visitor who arrived through the emailed link (they hold a recovery session). */
export async function resetPasswordAction(input: unknown): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const member = await getMember();
  if (!member) return fail("unauthenticated");
  if (!rateLimit(`reset-save:${member.user.id}`, 10, 60 * 60_000).ok) return fail("rate_limited");

  const { error } = await member.supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (/same|different/i.test(error.message)) return fail("validation", { password: "same_password" });
    if (/weak|password/i.test(error.message)) return fail("validation", { password: "password_weak" });
    return fail("unknown");
  }
  // End every other session, so a stolen session cannot outlive the password change.
  await member.supabase.auth.signOut({ scope: "others" });
  return { ok: true };
}

/** Confirms the member really knows the current password before a sensitive change. */
async function verifyCurrentPassword(member: NonNullable<Awaited<ReturnType<typeof getMember>>>, password: string) {
  if (!member.user.email) return false;
  const { error } = await member.supabase.auth.signInWithPassword({ email: member.user.email, password });
  return !error;
}

export async function changePasswordAction(input: unknown): Promise<ActionResult> {
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const member = await getMember();
  if (!member) return fail("unauthenticated");
  if (!rateLimit(`pw-change:${member.user.id}`, 6, 60 * 60_000).ok) return fail("rate_limited");
  if (!(await verifyCurrentPassword(member, parsed.data.currentPassword))) return fail("validation", { currentPassword: "wrong_password" });
  if (parsed.data.currentPassword === parsed.data.password) return fail("validation", { password: "same_password" });

  const { error } = await member.supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return fail(/weak|password/i.test(error.message) ? "validation" : "unknown", /weak|password/i.test(error.message) ? { password: "password_weak" } : undefined);
  await member.supabase.auth.signOut({ scope: "others" });
  return { ok: true };
}

export async function changeEmailAction(input: unknown): Promise<ActionResult> {
  const parsed = changeEmailSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const member = await getMember();
  if (!member) return fail("unauthenticated");
  if (!rateLimit(`email-change:${member.user.id}`, 4, 60 * 60_000).ok) return fail("rate_limited");
  if (!(await verifyCurrentPassword(member, parsed.data.password))) return fail("validation", { password: "wrong_password" });
  if (parsed.data.email === member.user.email) return fail("validation", { email: "already_exists" });

  const { error } = await member.supabase.auth.updateUser({ email: parsed.data.email });
  if (error) {
    if (/already|registered|exists/i.test(error.message)) return fail("validation", { email: "already_exists" });
    return fail(error.status === 429 ? "rate_limited" : "unknown");
  }
  return { ok: true };
}

export async function deleteAccountAction(input: unknown): Promise<ActionResult> {
  const parsed = deleteAccountSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const member = await getMember();
  if (!member) return fail("unauthenticated");
  if (!rateLimit(`account-delete:${member.user.id}`, 5, 60 * 60_000).ok) return fail("rate_limited");
  if (!(await verifyCurrentPassword(member, parsed.data.password))) return fail("validation", { password: "wrong_password" });

  const { error } = await member.supabase.rpc("delete_my_account");
  if (error) return fail(/staff_cannot_self_delete/.test(error.message) ? "validation" : "unknown", /staff_cannot_self_delete/.test(error.message) ? { password: "staff_cannot_self_delete" } : undefined);
  await member.supabase.auth.signOut();
  return { ok: true };
}
