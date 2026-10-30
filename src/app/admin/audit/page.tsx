import { AdminPage, FilterTabs, formatDateTime, Panel, Table } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { createClient } from "@/lib/supabase/server";
import { firstParam, toInt } from "@/lib/utils";

export const metadata = { title: "Audit log" };
export const dynamic = "force-dynamic";
const PAGE_SIZE = 30;
const ENTITIES = ["schools", "reviews", "articles", "community_posts", "community_comments", "advertisements", "users", "media_files"];

type Row = { id: number; action: string; entity_type: string; entity_id: string | null; old_data: Record<string, unknown> | null; new_data: Record<string, unknown> | null; created_at: string; users: { email: string } | null };

function summary(row: Row) {
  const data = row.new_data ?? row.old_data ?? {};
  const keys = Object.keys(data).filter((k) => !["id", "created_at"].includes(k)).slice(0, 4);
  return keys.map((k) => {
    const raw = data[k];
    const text = typeof raw === "object" ? JSON.stringify(raw) : String(raw);
    return `${k}: ${text.length > 40 ? `${text.slice(0, 40)}…` : text}`;
  }).join(" · ");
}

export default async function AdminAudit({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const entity = firstParam(sp.entity) ?? "";
  const page = Math.max(1, toInt(firstParam(sp.page)) ?? 1);
  const supabase = await createClient();

  let query = supabase.from("audit_logs").select("id,action,entity_type,entity_id,old_data,new_data,created_at,users(email)", { count: "exact" });
  if (entity) query = query.eq("entity_type", entity);
  const { data, count } = await query.order("created_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const rows = (data ?? []) as unknown as Row[];
  const tone = { insert: "success", update: "info", delete: "danger" } as const;

  return (
    <AdminPage title="Audit log" description="Every change made by staff and members to key content, recorded automatically by the database.">
      <FilterTabs param="entity" current={entity} base="/admin/audit" items={[{ value: "", label: "All" }, ...ENTITIES.map((e) => ({ value: e, label: e.replace(/_/g, " ") }))]} />
      <Panel>
        <Table head={["When", "Who", "Action", "Entity", "Changes"]} empty={rows.length === 0 ? "No audit entries yet. Edit something in the admin panel to see it here." : undefined}>
          {rows.map((r) => (
            <tr key={r.id} className="align-top">
              <td className="whitespace-nowrap px-4 py-3 text-ink-600">{formatDateTime(r.created_at)}</td>
              <td className="px-4 py-3">{r.users?.email ?? "system"}</td>
              <td className="px-4 py-3"><Badge tone={tone[r.action as keyof typeof tone] ?? "neutral"} className="capitalize">{r.action}</Badge></td>
              <td className="px-4 py-3 capitalize">{r.entity_type.replace(/_/g, " ")}<p className="max-w-40 truncate font-mono text-caption text-ink-500">{r.entity_id}</p></td>
              <td className="max-w-md px-4 py-3 text-caption text-ink-600">{summary(r)}</td>
            </tr>
          ))}
        </Table>
      </Panel>
      <Pagination page={page} totalPages={Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))} hrefFor={(p) => `/admin/audit?${new URLSearchParams({ ...(entity ? { entity } : {}), page: String(p) })}`} prevLabel="Previous page" nextLabel="Next page" />
    </AdminPage>
  );
}
