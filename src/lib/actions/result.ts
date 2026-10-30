import type { ZodError } from "zod";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: ActionErrorCode; fieldErrors?: Record<string, string> };

export type ActionErrorCode =
  | "unauthenticated"
  | "forbidden"
  | "validation"
  | "rate_limited"
  | "spam_detected"
  | "duplicate_content"
  | "already_exists"
  | "not_found"
  | "banned"
  | "unknown";

export function fail(error: ActionErrorCode, fieldErrors?: Record<string, string>): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

export function fromZod(error: ZodError): ActionResult<never> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!(key in fieldErrors)) fieldErrors[key] = issue.message;
  }
  return fail("validation", fieldErrors);
}

/** Maps database exceptions raised by the guard triggers and RLS to action error codes. */
export function fromDatabaseError(error: { message?: string; code?: string } | null): ActionResult<never> {
  const message = error?.message ?? "";
  if (message.includes("spam_detected")) return fail("spam_detected");
  if (message.includes("rate_limited")) return fail("rate_limited");
  if (message.includes("duplicate_content")) return fail("duplicate_content");
  if (error?.code === "23505") return fail("already_exists");
  if (error?.code === "42501" || message.includes("row-level security")) return fail("forbidden");
  return fail("unknown");
}
