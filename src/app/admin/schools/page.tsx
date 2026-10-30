import { FileUp, Plus, Search } from "lucide-react";
import Link from "next/link";
import { AdminPage, FilterTabs, formatDateTime, Panel, StatusPill, Table } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/action-buttons";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { setSchoolStatusAction } from "@/lib/actions/admin";
import { createClient } from "@/lib/supabase/server";
import { firstParam, toInt } from "@/lib/utils";

export const metadata = { title: "Schools" };
export const dynamic = "force-dynamic";
const PAGE_SIZE = 20;

type Row = {
  id: string; slug: string; name: { en?: string }; status: "draft" | "published" | "archived"; rating_avg: number; rating_count: number;
  view_count: number; updated_at: string; school_type: string; cities: { name: { en?: string } } | null;
  school_locations: { lat: number | null }[] | { lat: number | null } | null;
};

/** True when the school can be placed on the map. */
const hasCoordinates = (s: Row) => (Array.isArray(s.school_locations) ? s.school_locations[0]?.lat != null : s.school_locations?.lat != null);

export default async function AdminSchools({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const status = firstParam(sp.status) ?? "";
  const q = firstParam(sp.q)?.replace(/[%_\\(),]/g, " ").trim() ?? "";
  const page = Math.max(1, toInt(firstParam(sp.page)) ?? 1);
  const supabase = await createClient();

  const count = (s?: "draft" | "published" | "archived") => {
    const query = supabase.from("schools").select("id", { count: "exact", head: true });
    return s ? query.eq("status", s) : query;
  };
  const [all, published, draft, archived] = await Promise.all([count(), count("published"), count("draft"), count("archived")]);

  let query = supabase.from("schools").select("id,slug,name,status,rating_avg,rating_count,view_count,updated_at,school_type,cities(name),school_locations(lat)", { count: "exact" });
  if (status) query = query.eq("status", status as "draft");
  if (q) query = query.ilike("search_text", `%${q.toLowerCase()}%`);
  const { data, count: total } = await query.order("updated_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const rows = (data ?? []) as unknown as Row[];

  const hrefFor = (p: number) => `/admin/schools?${new URLSearchParams({ ...(status ? { status } : {}), ...(q ? { q } : {}), page: String(p) })}`;

  return (
    <AdminPage
      title="Schools"
      description="Create, edit, publish and remove school profiles."
      actions={<div className="flex gap-2"><Button asChild variant="outline"><Link href="/admin/schools/import"><FileUp /> Import from a file</Link></Button><Button asChild><Link href="/admin/schools/new"><Plus /> New school</Link></Button></div>}
    >
      <FilterTabs
        current={status}
        base="/admin/schools"
        items={[
          { value: "", label: "All", count: all.count ?? 0 },
          { value: "published", label: "Published", count: published.count ?? 0 },
          { value: "draft", label: "Drafts", count: draft.count ?? 0 },
          { value: "archived", label: "Archived", count: archived.count ?? 0 },
        ]}
      />
      <form className="mb-4 flex max-w-md gap-2" role="search">
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <label className="relative flex-1">
          <span className="sr-only">Search schools</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
          <input name="q" defaultValue={q} placeholder="Search by name…" className="h-11 w-full rounded-control border border-ink-300 bg-white pl-9 pr-3 text-small focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-100" />
        </label>
        <Button type="submit" variant="outline">Search</Button>
      </form>

      <Panel>
        <Table head={["School", "City", "Status", "Rating", "Views", "Updated", ""]} empty={rows.length === 0 ? "No schools found." : undefined}>
          {rows.map((s) => (
            <tr key={s.id} className="hover:bg-ink-50">
              <td className="px-4 py-3"><Link href={`/admin/schools/${s.id}`} className="font-semibold text-brand-700 hover:underline">{s.name.en}</Link><p className="text-caption capitalize text-ink-500">{s.school_type}</p>
                {s.status === "published" && !hasCoordinates(s) ? <p className="text-caption font-medium text-warning-700">No map location: add coordinates so it appears on the map.</p> : null}</td>
              <td className="px-4 py-3">{s.cities?.name?.en}</td>
              <td className="px-4 py-3"><StatusPill status={s.status} /></td>
              <td className="px-4 py-3">{s.rating_count > 0 ? `${s.rating_avg} (${s.rating_count})` : "—"}</td>
              <td className="px-4 py-3">{s.view_count}</td>
              <td className="whitespace-nowrap px-4 py-3 text-ink-600">{formatDateTime(s.updated_at)}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  {s.status === "published" ? (
                    <ActionButton size="sm" variant="outline" action={setSchoolStatusAction} args={[s.id, "draft"]}>Unpublish</ActionButton>
                  ) : (
                    <ActionButton size="sm" variant="secondary" action={setSchoolStatusAction} args={[s.id, "published"]}>Publish</ActionButton>
                  )}
                  <Button asChild size="sm" variant="ghost"><Link href={`/admin/school-stats/${s.id}`}>Stats</Link></Button>
                  <Button asChild size="sm" variant="ghost"><Link href={`/admin/schools/${s.id}`}>Edit</Link></Button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Panel>
      <Pagination page={page} totalPages={Math.max(1, Math.ceil((total ?? 0) / PAGE_SIZE))} hrefFor={hrefFor} prevLabel="Previous page" nextLabel="Next page" />
    </AdminPage>
  );
}
