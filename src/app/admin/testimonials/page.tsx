import { DecisionControls } from "@/components/admin/decision-controls";
import { ActionButton } from "@/components/admin/action-buttons";
import { GuestVoiceEditor } from "@/components/admin/guest-voice-editor";
import { AdminPage, FilterTabs, formatDateTime, Panel, StatusPill } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { deleteTestimonialAction, setTestimonialStatusAction } from "@/lib/actions/admin";
import { createClient } from "@/lib/supabase/server";
import { firstParam } from "@/lib/utils";

export const metadata = { title: "Opinions about the site" };
export const dynamic = "force-dynamic";

type Row = {
  id: string; kind: "member" | "invited"; author_name: string; author_title: string | null; quote: Record<string, string>; status: "pending" | "published" | "rejected";
  is_demo: boolean; consent_note: string | null; admin_note: string | null; created_at: string;
};

export default async function AdminTestimonials({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const status = firstParam(sp.status) ?? "pending";
  const supabase = await createClient();
  const count = (s?: Row["status"]) => {
    const q = supabase.from("site_testimonials").select("id", { count: "exact", head: true });
    return s ? q.eq("status", s) : q;
  };
  const [pending, published, rejected, all] = await Promise.all([count("pending"), count("published"), count("rejected"), count()]);
  let query = supabase.from("site_testimonials").select("id,kind,author_name,author_title,quote,status,is_demo,consent_note,admin_note,created_at");
  if (status !== "all") query = query.eq("status", status as Row["status"]);
  const { data } = await query.order("created_at", { ascending: status === "pending" }).limit(60);
  const rows = (data ?? []) as unknown as Row[];

  return (
    <AdminPage
      title="Opinions about the site"
      description="What the home page shows under “What people say about EduMaps.kg”. Members send their opinion for review; you can also add opinions from invited guests. Only quote people who have agreed, and keep the permission note."
      actions={<GuestVoiceEditor />}
    >
      <FilterTabs
        current={status}
        base="/admin/testimonials"
        items={[
          { value: "pending", label: "Waiting", count: pending.count ?? 0 }, { value: "published", label: "Shown", count: published.count ?? 0 },
          { value: "rejected", label: "Rejected", count: rejected.count ?? 0 }, { value: "all", label: "All", count: all.count ?? 0 },
        ]}
      />
      <div className="space-y-4">
        {rows.length === 0 ? <Panel><p className="px-5 py-12 text-center text-small text-ink-500">Nothing here. The home page hides the section until at least one opinion is shown.</p></Panel> : null}
        {rows.map((r) => (
          <Panel key={r.id}>
            <div className="space-y-3 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill status={r.status === "published" ? "published" : r.status} />
                <Badge tone={r.kind === "invited" ? "info" : "leaf"}>{r.kind === "invited" ? "Guest" : "Member"}</Badge>
                {r.is_demo ? <Badge tone="warning">Demo</Badge> : null}
                <span className="text-caption text-ink-500">{formatDateTime(r.created_at)}</span>
              </div>
              <p className="text-small font-semibold">{r.author_name}{r.author_title ? <span className="font-normal text-ink-600"> · {r.author_title}</span> : null}</p>
              <div className="space-y-1 rounded-control bg-ink-50 p-3 text-small text-ink-800">
                {Object.entries(r.quote).map(([lang, text]) => <p key={lang}><span className="mr-2 text-caption font-bold uppercase text-ink-500">{lang}</span>{text}</p>)}
              </div>
              {r.consent_note ? <p className="text-caption text-ink-600"><span className="font-semibold">Permission:</span> {r.consent_note}</p> : null}
              {r.admin_note ? <p className="text-small text-ink-700"><span className="font-semibold">Note:</span> {r.admin_note}</p> : null}
              <DecisionControls action={setTestimonialStatusAction as never} id={r.id} placeholder="Note for the member (optional, they can see it)" options={[
                ...(r.status !== "published" ? [{ value: "published", label: "Show on home page", variant: "secondary" as const }] : []),
                ...(r.status !== "pending" ? [{ value: "pending", label: "Hide (back to waiting)", variant: "outline" as const }] : []),
                ...(r.status !== "rejected" ? [{ value: "rejected", label: "Reject", variant: "ghost" as const }] : []),
              ]} />
              <div className="flex gap-2">
                {r.kind === "invited" ? <GuestVoiceEditor voice={{ id: r.id, author_name: r.author_name, author_title: r.author_title ?? "", quote: r.quote, consent_note: r.consent_note ?? "", status: r.status === "published" ? "published" : "pending", is_demo: r.is_demo }} /> : null}
                <ActionButton size="sm" variant="ghost" className="text-danger-600" confirm="Delete this opinion permanently?" action={deleteTestimonialAction} args={[r.id]}>Delete</ActionButton>
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </AdminPage>
  );
}
