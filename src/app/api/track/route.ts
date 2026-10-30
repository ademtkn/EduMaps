import { NextResponse } from "next/server";
import { z } from "zod";
import { createPublicClient } from "@/lib/supabase/public";
import { isSameOrigin } from "@/lib/security/origin";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

const SOURCES = ["direct", "home", "directory", "map", "compare", "city", "education", "community", "other_school", "search_engine", "external", "internal"] as const;
const CONTACTS = ["whatsapp", "phone", "email", "website", "directions", "google_maps", "gis2", "share", "document"] as const;
const SECTIONS = ["overview", "about", "programs", "languages", "facilities", "activities", "tuition", "transportation", "documents", "gallery", "videos", "location", "reviews", "faq"] as const;
const TIMES = ["lt10", "s10_30", "s30_120", "gt120"] as const;

const bodySchema = z.object({
  type: z.enum(["school_view", "article_view", "post_view", "map_open", "compare", "search", "ad_impression", "contact_click", "section_view", "time_on_page", "compare_add"]),
  id: z.string().uuid().optional(),
  lang: z.enum(["kg", "ru", "en"]).optional(),
  meta: z.string().max(24).optional(),
});

/** Which values a type may carry; anything else is dropped so the statistics cannot be polluted with free text. */
const ALLOWED_META: Partial<Record<z.infer<typeof bodySchema>["type"], readonly string[]>> = {
  school_view: SOURCES, contact_click: CONTACTS, section_view: SECTIONS, time_on_page: TIMES,
};

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ ok: false }, { status: 403 });
  if (!rateLimit(`track:${clientIp(request.headers)}`, 300, 60_000).ok) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  const { type, id, lang } = parsed.data;
  const allowed = ALLOWED_META[parsed.data.type];
  const meta = allowed && parsed.data.meta && allowed.includes(parsed.data.meta) ? parsed.data.meta : undefined;
  if ((parsed.data.type === "contact_click" || parsed.data.type === "section_view" || parsed.data.type === "time_on_page") && !meta) return NextResponse.json({ ok: false }, { status: 400 });
  if (["school_view", "contact_click", "section_view", "time_on_page", "compare_add"].includes(parsed.data.type) && !id) return NextResponse.json({ ok: false }, { status: 400 });
  const db = createPublicClient({ fresh: true });
  if (type === "ad_impression") {
    if (!id) return NextResponse.json({ ok: false }, { status: 400 });
    await db.rpc("track_ad_event", { p_ad: id, p_event: "impression", p_lang: lang });
  } else {
    await db.rpc("track_event", { p_type: type, p_entity: id, p_lang: lang, p_meta: meta });
  }
  return NextResponse.json({ ok: true });
}
