import { AdminPage } from "@/components/admin/ui";
import { ArticleForm } from "@/components/admin/article-form";
import { EMPTY_ARTICLE } from "@/lib/admin-defaults";
import { createClient } from "@/lib/supabase/server";
import { firstParam } from "@/lib/utils";

export const metadata = { title: "New article" };
export const dynamic = "force-dynamic";

export default async function NewArticlePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const kind = firstParam((await searchParams).kind);
  const supabase = await createClient();
  const { data } = await supabase.from("article_categories").select("id,name").order("sort_order");
  return (
    <AdminPage title={kind === "video" ? "New video" : "New article"}>
      <ArticleForm
        initial={EMPTY_ARTICLE(kind === "video" ? "video" : kind === "guide" ? "guide" : "article")}
        categories={(data ?? []).map((c) => ({ id: c.id, name: (c.name as { en?: string }).en ?? "" }))}
      />
    </AdminPage>
  );
}
