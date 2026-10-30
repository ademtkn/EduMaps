import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";

/** Uptime probe: 200 when the site and its database answer, 503 otherwise. Reveals nothing but the status. */
export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  try {
    const { error } = await createPublicClient({ fresh: true }).from("languages").select("code", { head: true, count: "exact" }).limit(1);
    if (error) throw error;
    return NextResponse.json({ status: "ok" }, { headers });
  } catch {
    return NextResponse.json({ status: "unavailable" }, { status: 503, headers });
  }
}
