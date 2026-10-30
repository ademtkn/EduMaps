import { Plus } from "lucide-react";
import Link from "next/link";
import { ActionButton } from "./action-buttons";
import { AdminPage, FilterTabs, formatDateTime, Panel, StatusPill, Table } from "./ui";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { deleteArticleAction } from "@/lib/actions/admin";
import { createClient } from "@/lib/supabase/server";
import { firstParam, toInt } from "@/lib/utils";

const PAGE_SIZE = 20;
type Row = { id: string; slug: string; kind: string; title: { en?: string }; status: "draft" | "published" | "archived"; view_count: number; published_at: string | null; updated_at: string; article_categories: { name: { en?: string } } | null };

export async function ArticleList({ kind, searchParams }: { kind?: "video"; searchParams: Record<string, string | string[] | undefined> }) {
  const status = firstParam(searchParams.status) ?? "";
  const page = Math.max(1, toInt(firstParam(searchParams.page)) ?? 1);
  const base = kind === "video" ? "/admin/videos" : "/admin/articles";
  const supabase = await createClient();

  let query = supabase.from("articles").select("id,slug,kind,title,status,view_count,published_at,updated_at,article_categories(name)", { count: "exact" });
  query = kind === "video" ? query.eq("kind", "video") : query.neq("kind", "video");
  if (status) query = query.eq("status", status as "draft");
  const { data, count } = await query.order("updated_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const rows = (data ?? []) as unknown as Row[];

  return (
    <AdminPage
      title={kind === "video" ? "Videos" : "Articles and guides"}
      description={kind === "video" ? "YouTube videos shown in the Education Hub." : "Education Hub articles and guides. Videos have their own list."}
      actions={<Button asChild><Link href={kind === "video" ? "/admin/articles/new?kind=video" : "/admin/articles/new"}><Plus /> {kind === "video" ? "New video" : "New article"}</Link></Button>}
    >
      <FilterTabs current={status} base={base} items={[{ value: "", label: "All" }, { value: "published", label: "Published" }, { value: "draft", label: "Drafts" }, { value: "archived", label: "Archived" }]} />
      <Panel>
        <Table head={["Title", "Category", "Type", "Status", "Views", "Updated", ""]} empty={rows.length === 0 ? "Nothing here yet." : undefined}>
          {rows.map((a) => (
            <tr key={a.id} className="hover:bg-ink-50">
              <td className="max-w-xs px-4 py-3"><Link href={`/admin/articles/${a.id}`} className="font-semibold text-brand-700 hover:underline">{a.title.en}</Link></td>
              <td className="px-4 py-3">{a.article_categories?.name?.en}</td>
              <td className="px-4 py-3 capitalize">{a.kind}</td>
              <td className="px-4 py-3"><StatusPill status={a.status} /></td>
              <td className="px-4 py-3">{a.view_count}</td>
              <td className="whitespace-nowrap px-4 py-3 text-ink-600">{formatDateTime(a.updated_at)}</td>
              <td className="px-4 py-3"><div className="flex justify-end gap-2">
                <Button asChild size="sm" variant="ghost"><Link href={`/admin/articles/${a.id}`}>Edit</Link></Button>
                <ActionButton size="sm" variant="ghost" className="text-danger-600 hover:bg-danger-50" confirm="Delete permanently?" action={deleteArticleAction} args={[a.id]}>Delete</ActionButton>
              </div></td>
            </tr>
          ))}
        </Table>
      </Panel>
      <Pagination page={page} totalPages={Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))} hrefFor={(p) => `${base}?${new URLSearchParams({ ...(status ? { status } : {}), page: String(p) })}`} prevLabel="Previous page" nextLabel="Next page" />
    </AdminPage>
  );
}
