import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { DEFAULT_LANG, isLang, localizedPath, type Lang } from "@/lib/i18n/config";
import { authOrigin, OAUTH_CONSENT_COOKIE, readOAuthConsent, safeOAuthNext } from "@/lib/auth/oauth";
import { LEGAL_VERSION } from "@/lib/company";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";

/**
 * Verifies email links and exchanges the OAuth PKCE code using the verifier cookie from the same browser.
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
  let lang: Lang = isLang(rawLang) ? rawLang : DEFAULT_LANG;
  let origin: string;
  try {
    origin = authOrigin(request.headers);
  } catch {
    return NextResponse.json({ error: "Authentication is temporarily unavailable." }, { status: 503 });
  }
  const type = url.searchParams.get("type") as EmailType | null;
  const tokenHash = url.searchParams.get("token_hash");
  let next: string | undefined;
  const redirect = (target: string) => {
    const response = NextResponse.redirect(new URL(target, origin));
    response.headers.set("Cache-Control", "no-store");
    return response;
  };
  const fail = (target = "/auth/login", error = "link") => {
    const destination = new URL(localizedPath(lang, target), origin);
    destination.searchParams.set("error", error);
    if (next) destination.searchParams.set("next", next);
    return redirect(`${destination.pathname}${destination.search}`);
  };

  if (!rateLimit(`auth-callback:${clientIp(request.headers)}`, 30, 5 * 60_000).ok) return fail();

  if (url.searchParams.has("code") || url.searchParams.has("flow") || url.searchParams.has("error")) {
    const cookieStore = await cookies();
    const consent = readOAuthConsent(cookieStore.get(OAUTH_CONSENT_COOKIE)?.value, url.searchParams.get("flow"), origin);
    // Consume proof on every callback, including cancellations and invalid/expired codes.
    cookieStore.set(OAUTH_CONSENT_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: origin.startsWith("https:"), path: "/api/auth/callback", maxAge: 0 });
    if (!consent) return fail("/auth/login", "oauth_consent");
    lang = consent.lang;
    next = safeOAuthNext(consent.next, localizedPath(lang, "/dashboard"), origin);
    if (url.searchParams.has("error")) {
      return fail("/auth/login", url.searchParams.get("error") === "access_denied" ? "oauth_cancelled" : "oauth");
    }
    const code = url.searchParams.get("code");
    if (!code || code.length > 2048) return fail("/auth/login", "oauth");
    let signedIn = false;
    let oauthClient: Awaited<ReturnType<typeof createClient>> | undefined;
    try {
      const supabase = await createClient();
      oauthClient = supabase;
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error || !data.user || !data.session) return fail("/auth/login", "oauth");
      signedIn = true;
      const { error: consentError } = await supabase.auth.updateUser({ data: {
        terms_accepted_at: new Date(consent.acceptedAt).toISOString(),
        terms_version: LEGAL_VERSION,
        preferred_lang: lang,
      } });
      if (consentError) {
        await supabase.auth.signOut({ scope: "local" });
        return fail("/auth/login", "oauth");
      }
      // Provider metadata does not carry our language choice on first registration.
      if (!data.user.user_metadata.terms_accepted_at) {
        const { error: profileError } = await supabase.from("profiles").update({ preferred_lang: lang }).eq("user_id", data.user.id);
        if (profileError) {
          await supabase.auth.signOut({ scope: "local" });
          return fail("/auth/login", "oauth");
        }
      }
      return redirect(next);
    } catch {
      if (signedIn && oauthClient) {
        try { await oauthClient.auth.signOut({ scope: "local" }); } catch { /* Preserve the authentication error response. */ }
      }
      return fail("/auth/login", "oauth");
    }
  }

  if (!tokenHash || tokenHash.length > 2048 || !type || !TYPES.includes(type)) return fail();
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) return fail(type === "recovery" ? "/auth/forgot-password" : "/auth/login");
    return redirect(destination(type, lang));
  } catch {
    return fail();
  }
}
