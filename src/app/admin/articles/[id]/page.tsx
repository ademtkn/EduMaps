import { notFound } from "next/navigation";
import { z } from "zod";
import { AdminPage } from "@/components/admin/ui";
import type { I18nValue } from "@/components/admin/fields";
import { ArticleForm, type ArticleFormValues } from "@/components/admin/article-form";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Edit article" };
export const dynamic = "force-dynamic";
const i = (v: unknown): I18nValue => (v && typeof v === "object" ? (v as I18nValue) : {});

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const supabase = await createClient();
  const [{ data: a }, { data: cats }] = await Promise.all([
    supabase.from("articles").select("*").eq("id", id).maybeSingle(),
    supabase.from("article_categories").select("id,name").order("sort_order"),
  ]);
  if (!a) notFound();
  const initial: ArticleFormValues = {
    id: a.id, slug: a.slug, category_id: a.category_id, kind: a.kind, title: i(a.title), excerpt: i(a.excerpt), body: i(a.body),
    cover_url: a.cover_url ?? "", video_url: a.video_url ?? "", tags: a.tags.join(", "), reading_minutes: a.reading_minutes, status: a.status, is_featured: a.is_featured,
  };
  return (
    <AdminPage title={(a.title as { en?: string }).en ?? "Edit"} description={`${a.view_count} views`}>
      <ArticleForm initial={initial} categories={(cats ?? []).map((c) => ({ id: c.id, name: (c.name as { en?: string }).en ?? "" }))} />
    </AdminPage>
  );
}
