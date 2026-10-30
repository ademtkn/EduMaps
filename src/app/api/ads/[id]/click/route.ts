import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createPublicClient } from "@/lib/supabase/public";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

/**
 * Click-through redirect. The destination is read from the database, never from the request,
 * so this cannot be abused as an open redirect.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return new NextResponse("Not found", { status: 404 });

  const lang = request.nextUrl.searchParams.get("lang");
  const db = createPublicClient({ fresh: true });
  const { data } = await db.from("advertisements").select("target_url").eq("id", id).maybeSingle();
  if (!data) return new NextResponse("Not found", { status: 404 });

  if (rateLimit(`adclick:${clientIp(request.headers)}:${id}`, 5, 60_000).ok) {
    await db.rpc("track_ad_event", { p_ad: id, p_event: "click", p_lang: lang === "kg" || lang === "ru" || lang === "en" ? lang : undefined });
  }
  return NextResponse.redirect(data.target_url, { status: 302, headers: { "Referrer-Policy": "no-referrer" } });
}
