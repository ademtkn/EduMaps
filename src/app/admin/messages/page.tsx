import { Mail } from "lucide-react";
import { AdminPage, FilterTabs, formatDateTime, Panel, StatusPill } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/action-buttons";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { deleteContactMessageAction, setContactStatusAction } from "@/lib/actions/admin";
import { createClient } from "@/lib/supabase/server";
import { firstParam, toInt } from "@/lib/utils";

export const metadata = { title: "Messages" };
export const dynamic = "force-dynamic";
const PAGE_SIZE = 15;

const TOPICS: Record<string, string> = {
  support: "Website help", add_school: "Add or claim a school", correction: "Correct school information",
  advertising: "Advertising", privacy: "Privacy or account deletion", other: "Other",
};

type Row = {
  id: string; name: string; email: string; topic: string; school: string | null; message: string; lang: string;
  status: "new" | "read" | "resolved"; created_at: string;
};

export default async function AdminMessages({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const status = firstParam(sp.status) ?? "new";
  const page = Math.max(1, toInt(firstParam(sp.page)) ?? 1);
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const me = auth.user ? (await supabase.from("users").select("role").eq("id", auth.user.id).maybeSingle()).data : null;
  const isAdmin = me?.role === "admin";

  const count = (s?: Row["status"]) => {
    const q = supabase.from("contact_messages").select("id", { count: "exact", head: true });
    return s ? q.eq("status", s) : q;
  };
  const [fresh, read, resolved, all] = await Promise.all([count("new"), count("read"), count("resolved"), count()]);

  let query = supabase.from("contact_messages").select("id,name,email,topic,school,message,lang,status,created_at", { count: "exact" });
  if (status !== "all") query = query.eq("status", status as Row["status"]);
  const { data, count: total } = await query.order("created_at", { ascending: status === "new" }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const rows = (data ?? []) as Row[];
  const hrefFor = (p: number) => `/admin/messages?${new URLSearchParams({ status, page: String(p) })}`;

  return (
    <AdminPage title="Messages" description="Messages sent through the public contact form. Reply by email, then mark them resolved.">
      <FilterTabs
        current={status}
        base="/admin/messages"
        items={[
          { value: "new", label: "New", count: fresh.count ?? 0 },
          { value: "read", label: "Read", count: read.count ?? 0 },
          { value: "resolved", label: "Resolved", count: resolved.count ?? 0 },
          { value: "all", label: "All", count: all.count ?? 0 },
        ]}
      />
      <div className="space-y-4">
        {rows.length === 0 ? <Panel><p className="px-5 py-12 text-center text-small text-ink-500">Nothing here.</p></Panel> : null}
        {rows.map((m) => (
          <Panel key={m.id}>
            <div className="space-y-3 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill status={m.status} />
                <Badge tone="info">{TOPICS[m.topic] ?? m.topic}</Badge>
                <Badge tone="neutral" className="uppercase">{m.lang}</Badge>
                <span className="text-caption text-ink-500">{formatDateTime(m.created_at)}</span>
              </div>
              <p className="text-small">
                <span className="font-semibold text-ink-900">{m.name}</span>{" "}
                <a href={`mailto:${m.email}?subject=EduMaps.kg`} className="inline-flex items-center gap-1 text-brand-700 hover:underline"><Mail className="size-3.5" />{m.email}</a>
              </p>
              {m.school ? <p className="text-caption text-ink-600">School: {m.school}</p> : null}
              <p className="whitespace-pre-line text-small text-ink-800">{m.message}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {m.status !== "read" ? <ActionButton size="sm" variant="outline" action={setContactStatusAction} args={[m.id, "read"]}>Mark read</ActionButton> : null}
                {m.status !== "resolved" ? <ActionButton size="sm" variant="secondary" action={setContactStatusAction} args={[m.id, "resolved"]}>Resolve</ActionButton> : null}
                {m.status !== "new" ? <ActionButton size="sm" variant="ghost" action={setContactStatusAction} args={[m.id, "new"]}>Mark new</ActionButton> : null}
                {isAdmin ? <ActionButton size="sm" variant="ghost" className="text-danger-600" confirm="Delete this message permanently?" action={deleteContactMessageAction} args={[m.id]}>Delete</ActionButton> : null}
              </div>
            </div>
          </Panel>
        ))}
      </div>
      <Pagination page={page} totalPages={Math.max(1, Math.ceil((total ?? 0) / PAGE_SIZE))} hrefFor={hrefFor} prevLabel="Previous page" nextLabel="Next page" />
    </AdminPage>
  );
}
