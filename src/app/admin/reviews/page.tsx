import { Star } from "lucide-react";
import Link from "next/link";
import { AdminPage, FilterTabs, formatDateTime, Panel, StatusPill } from "@/components/admin/ui";
import { ReviewActions } from "@/components/admin/moderation";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { createClient } from "@/lib/supabase/server";
import { firstParam, toInt } from "@/lib/utils";

export const metadata = { title: "Reviews" };
export const dynamic = "force-dynamic";
const PAGE_SIZE = 15;

type Row = {
  id: string; title: string; body: string; rating: number; status: "pending" | "published" | "rejected" | "hidden"; is_flagged: boolean; flag_reason: string | null;
  moderation_note: string | null; created_at: string; relationship: string; helpful_count: number;
  schools: { slug: string; name: { en?: string } } | null; profiles: { display_name: string } | null;
};

export default async function AdminReviews({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const status = firstParam(sp.status) ?? "pending";
  const page = Math.max(1, toInt(firstParam(sp.page)) ?? 1);
  const supabase = await createClient();

  const count = (build: (q: ReturnType<typeof base>) => ReturnType<typeof base>) => build(base());
  function base() {
    return supabase.from("reviews").select("id", { count: "exact", head: true });
  }
  const [pending, flagged, published, rejected, hidden, all] = await Promise.all([
    count((q) => q.eq("status", "pending")), count((q) => q.eq("is_flagged", true)), count((q) => q.eq("status", "published")),
    count((q) => q.eq("status", "rejected")), count((q) => q.eq("status", "hidden")), count((q) => q),
  ]);

  let query = supabase
    .from("reviews")
    .select("id,title,body,rating,status,is_flagged,flag_reason,moderation_note,created_at,relationship,helpful_count,schools(slug,name),profiles(display_name)", { count: "exact" });
  if (status === "flagged") query = query.eq("is_flagged", true);
  else if (status !== "all") query = query.eq("status", status as "pending");
  const { data, count: total } = await query.order("created_at", { ascending: status === "pending" }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const rows = (data ?? []) as unknown as Row[];

  return (
    <AdminPage title="Reviews" description="Approve, reject, edit or flag reviews. Approved reviews update the school's rating automatically.">
      <FilterTabs
        current={status}
        base="/admin/reviews"
        items={[
          { value: "pending", label: "Pending", count: pending.count ?? 0 },
          { value: "flagged", label: "Flagged", count: flagged.count ?? 0 },
          { value: "published", label: "Published", count: published.count ?? 0 },
          { value: "rejected", label: "Rejected", count: rejected.count ?? 0 },
          { value: "hidden", label: "Hidden", count: hidden.count ?? 0 },
          { value: "all", label: "All", count: all.count ?? 0 },
        ]}
      />
      <div className="space-y-4">
        {rows.length === 0 ? <Panel><p className="px-5 py-12 text-center text-small text-ink-500">Nothing here.</p></Panel> : null}
        {rows.map((r) => (
          <Panel key={r.id}>
            <div className="space-y-3 p-5">
              <div className="flex flex-wrap items-center gap-2 text-small">
                <StatusPill status={r.status} />
                {r.is_flagged ? <Badge tone="danger">Flagged{r.flag_reason ? `: ${r.flag_reason}` : ""}</Badge> : null}
                <span className="inline-flex items-center gap-1 font-semibold text-warning-700"><Star className="size-4 fill-current" />{r.rating}</span>
                <Link className="font-semibold text-brand-700 hover:underline" href={`/kg/schools/${r.schools?.slug}`} target="_blank">{r.schools?.name?.en}</Link>
                <span className="text-ink-500">by {r.profiles?.display_name} ({r.relationship}) · {formatDateTime(r.created_at)} · {r.helpful_count} helpful</span>
              </div>
              <h2 className="text-body font-semibold">{r.title}</h2>
              <p className="whitespace-pre-line text-small text-ink-700">{r.body}</p>
              {r.moderation_note ? <p className="rounded-control bg-warning-50 p-3 text-small"><strong>Moderator note:</strong> {r.moderation_note}</p> : null}
              <ReviewActions review={r} />
            </div>
          </Panel>
        ))}
      </div>
      <Pagination page={page} totalPages={Math.max(1, Math.ceil((total ?? 0) / PAGE_SIZE))} hrefFor={(p) => `/admin/reviews?status=${status}&page=${p}`} prevLabel="Previous page" nextLabel="Next page" />
    </AdminPage>
  );
}
