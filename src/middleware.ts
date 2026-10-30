import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LANG, LANG_COOKIE, isLang, stripLang } from "@/lib/i18n/config";
import { refreshSession } from "@/lib/supabase/middleware";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

const PROTECTED_PREFIXES = ["/dashboard", "/admin", "/community/new"];

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const { lang, path } = stripLang(pathname);

  // The admin console is English-only and lives outside the language prefix.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const response = NextResponse.next({ request });
    const user = await refreshSession(request, response);
    if (!user) {
      const login = request.nextUrl.clone();
      login.pathname = `/${DEFAULT_LANG}/auth/login`;
      login.search = `?next=${encodeURIComponent(pathname + search)}`;
      return NextResponse.redirect(login);
    }
    return response;
  }

  // 1. Every page lives under /kg, /ru or /en. Unprefixed URLs go to the visitor's last language (default Kyrgyz).
  if (!lang) {
    const saved = request.cookies.get(LANG_COOKIE)?.value;
    const target = isLang(saved) ? saved : DEFAULT_LANG;
    const url = request.nextUrl.clone();
    url.pathname = `/${target}${pathname === "/" ? "" : pathname}`;
    url.search = search;
    return NextResponse.redirect(url, 308);
  }

  // 2. Global abuse guard for state changing requests (server actions are POSTs).
  if (request.method === "POST") {
    const result = rateLimit(`post:${clientIp(request.headers)}`, 90, 60_000);
    if (!result.ok) {
      return new NextResponse("Too many requests", {
        status: 429,
        headers: { "Retry-After": String(result.retryAfterSeconds) },
      });
    }
  }

  const response = NextResponse.next({ request });
  response.cookies.set(LANG_COOKIE, lang, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });

  // 3. Keep the session fresh and gate member-only areas.
  const user = await refreshSession(request, response);
  if (!user && PROTECTED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    const login = request.nextUrl.clone();
    login.pathname = `/${lang}/auth/login`;
    login.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(login);
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
