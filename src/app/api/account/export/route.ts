import { NextResponse } from "next/server";
import { LEGAL_VERSION } from "@/lib/company";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";

/** A signed-in member downloads everything the site holds about them (row level security limits each query to their own rows). */
export async function GET(request: Request) {
  if (!rateLimit(`export:${clientIp(request.headers)}`, 10, 60 * 60_000).ok) return new NextResponse("Too many requests", { status: 429 });
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new NextResponse("Unauthorized", { status: 401 });
  const id = auth.user.id;

  const [account, profile, reviews, posts, comments, favorites, votes] = await Promise.all([
    supabase.from("users").select("id,email,role,created_at").eq("id", id).maybeSingle(),
    supabase.from("profiles").select("*").eq("user_id", id).maybeSingle(),
    supabase.from("reviews").select("*").eq("user_id", id),
    supabase.from("community_posts").select("*").eq("user_id", id),
    supabase.from("community_comments").select("*").eq("user_id", id),
    supabase.from("favorites").select("*").eq("user_id", id),
    supabase.from("review_votes").select("*").eq("user_id", id),
  ]);

  const body = {
    exported_at: new Date().toISOString(),
    service: "EduMaps.kg",
    terms_version_in_force: LEGAL_VERSION,
    account: account.data,
    sign_up: { terms_accepted_at: auth.user.user_metadata?.terms_accepted_at ?? null, terms_version: auth.user.user_metadata?.terms_version ?? null },
    profile: profile.data,
    reviews: reviews.data ?? [],
    community_posts: posts.data ?? [],
    community_comments: comments.data ?? [],
    saved_items: favorites.data ?? [],
    helpful_votes: votes.data ?? [],
  };
  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="edumaps-my-data.json"',
      "Cache-Control": "no-store",
    },
  });
}
