import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import type { CategoryData, CommentData, PostData } from "./types";

const POST_SELECT =
  "id,title,body,status,is_pinned,comment_count,view_count,created_at,moderation_note,community_categories!inner(slug,name),profiles(display_name,avatar_url)";

export const POSTS_PER_PAGE = 12;

export async function listCommunityCategories(): Promise<CategoryData[]> {
  const { data } = await createPublicClient().from("community_categories").select("*").order("sort_order");
  return (data ?? []) as unknown as CategoryData[];
}

export async function listPosts(opts: { category?: string; page?: number; pageSize?: number } = {}): Promise<{ items: PostData[]; total: number }> {
  const pageSize = opts.pageSize ?? POSTS_PER_PAGE;
  const page = Math.max(1, opts.page ?? 1);
  let query = createPublicClient().from("community_posts").select(POST_SELECT, { count: "exact" }).eq("status", "published");
  if (opts.category) query = query.eq("community_categories.slug", opts.category);
  const { data, count, error } = await query
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);
  if (error) throw new Error(`listPosts failed: ${error.message}`);
  return { items: (data ?? []) as unknown as PostData[], total: count ?? 0 };
}

export async function getPost(id: string): Promise<PostData | null> {
  const { data } = await createPublicClient()
    .from("community_posts")
    .select(POST_SELECT)
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();
  return (data as unknown as PostData) ?? null;
}

export async function listComments(postId: string): Promise<CommentData[]> {
  const { data } = await createPublicClient()
    .from("community_comments")
    .select("id,body,created_at,user_id,profiles(display_name,avatar_url)")
    .eq("post_id", postId)
    .eq("status", "published")
    .order("created_at");
  return (data ?? []) as unknown as CommentData[];
}

export async function postCountsByCategory(): Promise<Record<string, number>> {
  const { data } = await createPublicClient()
    .from("community_posts")
    .select("community_categories!inner(slug)")
    .eq("status", "published");
  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as unknown as { community_categories: { slug: string } }[]) {
    counts[row.community_categories.slug] = (counts[row.community_categories.slug] ?? 0) + 1;
  }
  return counts;
}

export async function getAllPostIds(): Promise<{ id: string; created_at: string }[]> {
  const { data } = await createPublicClient().from("community_posts").select("id,created_at").eq("status", "published");
  return data ?? [];
}
