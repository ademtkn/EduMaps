import { Banknote, FileUp, ImageOff, MapPinOff, PhoneOff, Plus, Search } from "lucide-react";
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

/**
 * The fields that are missing most often. The directory was imported from public sources, so most
 * profiles still have no photo, no fee and no coordinates; these filters turn "619 schools need a
 * photo" into a list the team can work through instead of opening profiles one by one.
 */
const GAPS = [
  { value: "photos", label: "No photo", column: "has_cover" },
  { value: "logo", label: "No logo", column: "has_logo" },
  { value: "location", label: "No map pin", column: "has_location" },
  { value: "fee", label: "No fee", column: "has_fee" },
  { value: "address", label: "No address", column: "has_address" },
  { value: "contact", label: "No contact", column: "has_contact" },
] as const;

type Gap = (typeof GAPS)[number]["value"];
const isGap = (value: string): value is Gap => GAPS.some((gap) => gap.value === value);

type Row = {
  id: string; slug: string; name: { en?: string }; status: "draft" | "published" | "archived";
  school_type: string; updated_at: string; rating_avg: number; rating_count: number; view_count: number;
  city_name: { en?: string } | null;
  has_cover: boolean; has_location: boolean; has_fee: boolean; has_contact: boolean; media_count: number;
};

export default async function AdminSchools({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const status = firstParam(sp.status) ?? "";
  const gapParam = firstParam(sp.gap) ?? "";
  const gap = isGap(gapParam) ? gapParam : "";
  const q = firstParam(sp.q)?.replace(/[%_\\(),]/g, " ").trim() ?? "";
  const page = Math.max(1, toInt(firstParam(sp.page)) ?? 1);
  const supabase = await createClient();

  const view = () => supabase.from("admin_school_completeness");
  const statusCount = (s?: string) => {
    const query = view().select("id", { count: "exact", head: true });
    return s ? query.eq("status", s as "published") : query;
  };
  // Gap counts follow the status tab, so the number on a chip is always the number of rows the
  // filter will show.
  const gapCount = (column: (typeof GAPS)[number]["column"]) => {
    const query = view().select("id", { count: "exact", head: true }).eq(column, false);
    return status ? query.eq("status", status as "published") : query;
  };

  const [all, published, draft, archived, ...gapCounts] = await Promise.all([
    statusCount(), statusCount("published"), statusCount("draft"), statusCount("archived"),
    ...GAPS.map((g) => gapCount(g.column)),
  ]);

  let query = view().select(
    "id,slug,name,status,school_type,updated_at,rating_avg,rating_count,view_count,city_name,has_cover,has_location,has_fee,has_contact,media_count",
    { count: "exact" }
  );
  if (status) query = query.eq("status", status as "published");
  if (q) query = query.ilike("search_text", `%${q.toLowerCase()}%`);
  if (gap) query = query.eq(GAPS.find((g) => g.value === gap)!.column, false);
  const { data, count: total } = await query.order("updated_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const rows = (data ?? []) as unknown as Row[];

  const params = (over: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = { status, gap, q, ...over };
    for (const [key, value] of Object.entries(merged)) if (value) next.set(key, value);
    return next.toString();
  };
  const hrefForPage = (p: number) => `/admin/schools?${params({ page: String(p) })}`;

  return (
    <AdminPage
      title="Schools"
      description="Create, edit, publish and remove school profiles. Use the chips to find the profiles that still miss a photo, a map pin, a fee or contact details."
      actions={<div className="flex gap-2"><Button asChild variant="outline"><Link href="/admin/schools/import"><FileUp /> Import from a file</Link></Button><Button asChild><Link href="/admin/schools/new"><Plus /> New school</Link></Button></div>}
    >
      <FilterTabs
        current={status}
        base="/admin/schools"
        hrefFor={(value) => `/admin/schools?${params({ status: value || undefined, page: undefined })}`}
        items={[
          { value: "", label: "All", count: all.count ?? 0 },
          { value: "published", label: "Published", count: published.count ?? 0 },
          { value: "draft", label: "Drafts", count: draft.count ?? 0 },
          { value: "archived", label: "Archived", count: archived.count ?? 0 },
        ]}
      />
      <FilterTabs
        param="gap"
        base="/admin/schools"
        current={gap}
        hrefFor={(value) => `/admin/schools?${params({ gap: value || undefined, page: undefined })}`}
        items={[{ value: "", label: "Any completeness" }, ...GAPS.map((g, i) => ({ value: g.value, label: g.label, count: gapCounts[i]?.count ?? 0 }))]}
      />

      <form className="mb-4 flex max-w-md gap-2" role="search">
        {status ? <input type="hidden" name="status" value={status} /> : null}
        {gap ? <input type="hidden" name="gap" value={gap} /> : null}
        <label className="relative flex-1">
          <span className="sr-only">Search schools</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
          <input name="q" defaultValue={q} placeholder="Search by name…" className="h-11 w-full rounded-control border border-ink-300 bg-white pl-9 pr-3 text-small focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-100" />
        </label>
        <Button type="submit" variant="outline">Search</Button>
      </form>

      <Panel>
        <Table head={["School", "City", "Status", "Missing", "Rating", "Updated", ""]} empty={rows.length === 0 ? "No schools match this filter." : undefined}>
          {rows.map((s) => (
            <tr key={s.id} className="hover:bg-ink-50">
              <td className="px-4 py-3">
                <Link href={`/admin/schools/${s.id}`} className="font-semibold text-brand-700 hover:underline">{s.name.en}</Link>
                <p className="text-caption capitalize text-ink-500">{s.school_type} · {s.media_count} file(s)</p>
              </td>
              <td className="px-4 py-3">{s.city_name?.en}</td>
              <td className="px-4 py-3"><StatusPill status={s.status} /></td>
              <td className="px-4 py-3">
                <span className="flex items-center gap-2 text-ink-500">
                  {!s.has_cover ? <span title="No photo"><ImageOff className="size-4 text-warning-700" aria-label="No photo" /></span> : null}
                  {!s.has_location ? <span title="No map location"><MapPinOff className="size-4 text-warning-700" aria-label="No map location" /></span> : null}
                  {!s.has_fee ? <span title="No fee"><Banknote className="size-4 text-warning-700" aria-label="No fee" /></span> : null}
                  {!s.has_contact ? <span title="No contact details"><PhoneOff className="size-4 text-warning-700" aria-label="No contact details" /></span> : null}
                  {s.has_cover && s.has_location && s.has_fee && s.has_contact ? <span className="text-caption text-leaf-700">Complete</span> : null}
                </span>
              </td>
              <td className="px-4 py-3">{s.rating_count > 0 ? `${s.rating_avg} (${s.rating_count})` : "—"}</td>
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
      <Pagination page={page} totalPages={Math.max(1, Math.ceil((total ?? 0) / PAGE_SIZE))} hrefFor={hrefForPage} prevLabel="Previous page" nextLabel="Next page" />
    </AdminPage>
  );
}
