import { NextResponse, type NextRequest } from "next/server";
import { getAds } from "@/lib/data/ads";
import { getRandomSchools } from "@/lib/data/schools";
import { isLang } from "@/lib/i18n/config";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

/** A fresh random selection of schools (and the sponsored card, if one is running) for the home page. */
export async function GET(request: NextRequest) {
  if (!rateLimit(`home-schools:${clientIp(request.headers)}`, 60, 60_000).ok) {
    return NextResponse.json({ ok: false }, { status: 429, headers: { "Retry-After": "30" } });
  }
  const lang = request.nextUrl.searchParams.get("lang");
  const [schools, [ad]] = await Promise.all([getRandomSchools(6), getAds("home_grid", isLang(lang) ? lang : "kg", 1)]);
  return NextResponse.json({ ok: true, schools, ad: ad ?? null }, { headers: { "Cache-Control": "no-store" } });
}
