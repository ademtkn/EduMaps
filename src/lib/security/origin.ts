import { SITE_URL } from "@/lib/utils";

/**
 * CSRF defence for route handlers that change state. Server Actions are protected by Next.js
 * (Origin must match Host); this applies the same rule to plain POST handlers.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    const originHost = new URL(origin).host;
    return originHost === host || originHost === new URL(SITE_URL).host;
  } catch {
    return false;
  }
}
