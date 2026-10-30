import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LANG, isLang, localizedPath, type Lang } from "@/lib/i18n/config";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";

/**
 * Landing point of the links in our emails (confirm email, reset password, confirm new email).
 * The one-time token is verified here, which signs the visitor in, and they continue to the right page.
 */
const TYPES = ["recovery", "signup", "email_change", "email"] as const;
type EmailType = (typeof TYPES)[number];

function destination(type: EmailType, lang: Lang) {
  if (type === "recovery") return localizedPath(lang, "/auth/reset-password");
  if (type === "email_change") return `${localizedPath(lang, "/dashboard")}?tab=account&notice=email_changed`;
  return `${localizedPath(lang, "/dashboard")}?notice=email_confirmed`;
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const rawLang = url.searchParams.get("lang");
  const lang: Lang = isLang(rawLang) ? rawLang : DEFAULT_LANG;
  const type = url.searchParams.get("type") as EmailType | null;
  const tokenHash = url.searchParams.get("token_hash");
  const fail = (target = "/auth/login") => NextResponse.redirect(new URL(`${localizedPath(lang, target)}?error=link`, url.origin));

  if (!rateLimit(`auth-callback:${clientIp(request.headers)}`, 30, 5 * 60_000).ok) return fail();
  if (!tokenHash || !type || !TYPES.includes(type)) return fail();

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  if (error) return fail(type === "recovery" ? "/auth/forgot-password" : "/auth/login");
  return NextResponse.redirect(new URL(destination(type, lang), url.origin));
}
