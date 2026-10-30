import { NextResponse, type NextRequest } from "next/server";
import { isLang } from "@/lib/i18n/config";
import { tr } from "@/lib/i18n/localized";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import { createPublicClient } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";

const escapeLike = (value: string) => value.replace(/[%_\\(),.]/g, " ").replace(/\s+/g, " ").trim();

/** Names of schools and cities that match what the visitor has typed so far (published schools only). */
export async function GET(request: NextRequest) {
  const empty = { schools: [], cities: [] };
  if (!rateLimit(`suggest:${clientIp(request.headers)}`, 120, 60_000).ok) {
    return NextResponse.json(empty, { status: 429, headers: { "Retry-After": "20" } });
  }
  const langParam = request.nextUrl.searchParams.get("lang");
  const lang = isLang(langParam) ? langParam : "kg";
  const q = escapeLike((request.nextUrl.searchParams.get("q") ?? "").slice(0, 60).toLowerCase());
  if (q.length < 2) return NextResponse.json(empty, { headers: { "Cache-Control": "no-store" } });

  const db = createPublicClient();
  const [schools, cities] = await Promise.all([
    db.from("schools").select("slug,name,rating_count,cities!inner(name)").eq("status", "published").ilike("search_text", `%${q}%`).order("rating_count", { ascending: false }).limit(12),
    db.from("cities").select("slug,name").or(["kg", "ru", "en"].map((l) => `name->>${l}.ilike.%${q}%`).join(",")).limit(3),
  ]);

  const startsWith = (name: string) => name.toLowerCase().startsWith(q) || name.toLowerCase().split(/\s+/).some((word) => word.startsWith(q));
  const rows = (schools.data ?? []).map((s) => ({ slug: s.slug, name: tr(s.name as never, lang), city: tr((s.cities as unknown as { name: never }).name, lang) }));
  // names that begin with what was typed come first
  rows.sort((a, b) => Number(startsWith(b.name)) - Number(startsWith(a.name)));

  return NextResponse.json(
    {
      schools: rows.slice(0, 6),
      cities: (cities.data ?? []).map((c) => ({ slug: c.slug, name: tr(c.name as never, lang) })),
    },
    { headers: { "Cache-Control": "private, max-age=30" } },
  );
}
