import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import type { ArticleCardData, ArticleDetail, CategoryData } from "./types";

const CARD_SELECT =
  "id,slug,kind,title,excerpt,cover_url,reading_minutes,published_at,is_featured,article_categories!inner(slug,name),profiles(display_name)";

export const ARTICLES_PER_PAGE = 9;

export async function listArticleCategories(): Promise<CategoryData[]> {
  const { data } = await createPublicClient().from("article_categories").select("*").order("sort_order");
  return (data ?? []) as unknown as CategoryData[];
}

export async function listArticles(opts: {
  category?: string;
  kind?: string;
  page?: number;
  pageSize?: number;
  featuredFirst?: boolean;
  excludeId?: string;
} = {}): Promise<{ items: ArticleCardData[]; total: number }> {
  const pageSize = opts.pageSize ?? ARTICLES_PER_PAGE;
  const page = Math.max(1, opts.page ?? 1);
  let query = createPublicClient()
    .from("articles")
    .select(CARD_SELECT, { count: "exact" })
    .eq("status", "published");
  if (opts.category) query = query.eq("article_categories.slug", opts.category);
  if (opts.kind) query = query.eq("kind", opts.kind as ArticleCardData["kind"]);
  if (opts.excludeId) query = query.neq("id", opts.excludeId);
  if (opts.featuredFirst) query = query.order("is_featured", { ascending: false });
  const { data, count, error } = await query
    .order("published_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);
  if (error) throw new Error(`listArticles failed: ${error.message}`);
  return { items: (data ?? []) as unknown as ArticleCardData[], total: count ?? 0 };
}

export async function getArticle(slug: string): Promise<ArticleDetail | null> {
  const { data, error } = await createPublicClient()
    .from("articles")
    .select(`${CARD_SELECT},body,video_url,tags,updated_at,view_count`)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw new Error(`getArticle failed: ${error.message}`);
  return (data as unknown as ArticleDetail) ?? null;
}

export async function getAllArticleSlugs(): Promise<{ slug: string; category: string; updated_at: string }[]> {
  const { data } = await createPublicClient()
    .from("articles")
    .select("slug,updated_at,article_categories!inner(slug)")
    .eq("status", "published");
  return ((data ?? []) as unknown as { slug: string; updated_at: string; article_categories: { slug: string } }[]).map((r) => ({
    slug: r.slug,
    updated_at: r.updated_at,
    category: r.article_categories.slug,
  }));
}
