import { AdminPage, Panel, Table } from "@/components/admin/ui";
import { CategoryEditor } from "@/components/admin/category-editor";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Categories" };
export const dynamic = "force-dynamic";

type Cat = { id: string; slug: string; name: { kg?: string; ru?: string; en?: string }; description: { kg?: string; ru?: string; en?: string } | null; sort_order: number };

export default async function AdminCategories() {
  const supabase = await createClient();
  const [articles, community] = await Promise.all([
    supabase.from("article_categories").select("*").order("sort_order"),
    supabase.from("community_categories").select("*").order("sort_order"),
  ]);

  const section = (title: string, type: "article" | "community", rows: Cat[]) => (
    <Panel title={title} actions={<CategoryEditor type={type} />}>
      <Table head={["Name (EN)", "Kyrgyz", "Russian", "Slug", "Order", ""]}>
        {rows.map((c) => (
          <tr key={c.id}>
            <td className="px-4 py-3 font-semibold">{c.name.en}</td>
            <td className="px-4 py-3">{c.name.kg}</td>
            <td className="px-4 py-3">{c.name.ru}</td>
            <td className="px-4 py-3 text-ink-600">{c.slug}</td>
            <td className="px-4 py-3">{c.sort_order}</td>
            <td className="px-4 py-3 text-right"><CategoryEditor type={type} category={{ id: c.id, slug: c.slug, name: c.name, description: c.description ?? {}, sort_order: c.sort_order }} /></td>
          </tr>
        ))}
      </Table>
    </Panel>
  );

  return (
    <AdminPage title="Categories" description="Topics used by the Education Hub and the community.">
      <div className="space-y-6">
        {section("Education Hub topics", "article", (articles.data ?? []) as unknown as Cat[])}
        {section("Community topics", "community", (community.data ?? []) as unknown as Cat[])}
      </div>
    </AdminPage>
  );
}
