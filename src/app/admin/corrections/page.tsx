import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { DecisionControls } from "@/components/admin/decision-controls";
import { AdminPage, FilterTabs, formatDateTime, Panel, StatusPill } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { setCorrectionStatusAction } from "@/lib/actions/admin";
import { createClient } from "@/lib/supabase/server";
import { firstParam, toInt } from "@/lib/utils";

export const metadata = { title: "Corrections" };
export const dynamic = "force-dynamic";
const PAGE_SIZE = 15;

const TOPICS: Record<string, string> = {
  contact: "Phone, email or website", address: "Address or map location", fees: "Fees", hours: "School hours or days",
  programs: "Programs, languages or facilities", closed: "Closed or moved", missing: "Information missing", other: "Something else",
};
type Row = {
  id: string; topic: string; message: string; source_url: string | null; reporter_name: string | null; reporter_email: string | null; reporter_phone: string | null; reporter_role: string; lang: string;
  status: "new" | "reviewing" | "applied" | "rejected"; admin_note: string | null; created_at: string; user_id: string | null;
  schools: { id: string; slug: string; name: { en?: string } } | null;
};

export default async function AdminCorrections({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const status = firstParam(sp.status) ?? "new";
  const page = Math.max(1, toInt(firstParam(sp.page)) ?? 1);
  const supabase = await createClient();

  const count = (s?: Row["status"]) => {
    const q = supabase.from("correction_requests").select("id", { count: "exact", head: true });
    return s ? q.eq("status", s) : q;
  };
  const [fresh, reviewing, applied, rejected, all] = await Promise.all([count("new"), count("reviewing"), count("applied"), count("rejected"), count()]);

  let query = supabase.from("correction_requests")
    .select("id,topic,message,source_url,reporter_name,reporter_email,reporter_phone,reporter_role,lang,status,admin_note,created_at,user_id,schools(id,slug,name)", { count: "exact" });
  if (status !== "all") query = query.eq("status", status as Row["status"]);
  const { data, count: total } = await query.order("created_at", { ascending: status === "new" }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const rows = (data ?? []) as unknown as Row[];

  return (
    <AdminPage title="Corrections" description="Reports of wrong or outdated school information. Check the source, edit the school if the report is right, then mark it applied.">
      <FilterTabs
        current={status}
        base="/admin/corrections"
        items={[
          { value: "new", label: "New", count: fresh.count ?? 0 }, { value: "reviewing", label: "In review", count: reviewing.count ?? 0 },
          { value: "applied", label: "Applied", count: applied.count ?? 0 }, { value: "rejected", label: "Rejected", count: rejected.count ?? 0 },
          { value: "all", label: "All", count: all.count ?? 0 },
        ]}
      />
      <div className="space-y-4">
        {rows.length === 0 ? <Panel><p className="px-5 py-12 text-center text-small text-ink-500">Nothing here.</p></Panel> : null}
        {rows.map((r) => (
          <Panel key={r.id}>
            <div className="space-y-3 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill status={r.status === "new" ? "pending" : r.status === "applied" ? "published" : r.status === "reviewing" ? "draft" : "rejected"} />
                <Badge tone="info">{TOPICS[r.topic] ?? r.topic}</Badge>
                {r.reporter_role === "school_staff" ? <Badge tone="warning">From the school: verify before applying</Badge> : null}
                <span className="text-caption text-ink-500">{formatDateTime(r.created_at)} · {r.lang.toUpperCase()}</span>
              </div>
              {r.schools ? (
                <p className="text-small font-semibold">
                  <Link href={`/admin/schools/${r.schools.id}`} className="text-brand-700 hover:underline">{r.schools.name.en}</Link>
                  <a href={`/kg/schools/${r.schools.slug}`} target="_blank" rel="noreferrer" className="ml-2 inline-flex items-center gap-1 text-caption font-normal text-ink-500 hover:text-brand-700"><ExternalLink className="size-3" />public page</a>
                </p>
              ) : null}
              <p className="whitespace-pre-line text-small text-ink-800">{r.message}</p>
              {r.source_url ? <p className="break-all text-caption"><span className="text-ink-500">Source: </span><a href={r.source_url} target="_blank" rel="noopener noreferrer nofollow" className="text-brand-700 hover:underline">{r.source_url}</a></p> : null}
              <p className="text-caption text-ink-500">
                {r.reporter_name || r.reporter_email || r.reporter_phone || r.user_id
                  ? <>From {r.reporter_name ?? "anonymous"}{r.reporter_email ? <> · <a className="text-brand-700 hover:underline" href={`mailto:${r.reporter_email}?subject=EduMaps.kg`}>{r.reporter_email}</a></> : null}{r.reporter_phone ? <> · {r.reporter_phone}</> : null}{r.user_id ? " · signed-in member" : ""}</>
                  : "Anonymous report"}
              </p>
              {r.admin_note ? <p className="rounded-control bg-ink-50 p-3 text-small text-ink-700"><span className="font-semibold">Note:</span> {r.admin_note}</p> : null}
              <DecisionControls action={setCorrectionStatusAction as never} id={r.id} options={[
                ...(r.status !== "reviewing" ? [{ value: "reviewing", label: "In review" }] : []),
                ...(r.status !== "applied" ? [{ value: "applied", label: "Mark applied", variant: "secondary" as const }] : []),
                ...(r.status !== "rejected" ? [{ value: "rejected", label: "Reject", variant: "ghost" as const }] : []),
                ...(r.status !== "new" ? [{ value: "new", label: "Reopen", variant: "ghost" as const }] : []),
              ]} />
            </div>
          </Panel>
        ))}
      </div>
      <Pagination page={page} totalPages={Math.max(1, Math.ceil((total ?? 0) / PAGE_SIZE))} hrefFor={(p) => `/admin/corrections?${new URLSearchParams({ status, page: String(p) })}`} prevLabel="Previous page" nextLabel="Next page" />
    </AdminPage>
  );
}
