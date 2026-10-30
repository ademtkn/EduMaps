import Link from "next/link";
import { AdminPage, FilterTabs, formatDateTime, Panel, StatusPill } from "@/components/admin/ui";
import { CommentActions, PostActions } from "@/components/admin/moderation";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { createClient } from "@/lib/supabase/server";
import { firstParam, toInt } from "@/lib/utils";

export const metadata = { title: "Community" };
export const dynamic = "force-dynamic";
const PAGE_SIZE = 15;

type Post = {
  id: string; title: string; body: string; status: "pending" | "published" | "rejected" | "hidden"; is_flagged: boolean; flag_reason: string | null;
  is_pinned: boolean; moderation_note: string | null; created_at: string; comment_count: number;
  community_categories: { name: { en?: string } } | null; profiles: { display_name: string } | null;
};
type Comment = {
  id: string; body: string; status: "published" | "hidden" | "pending" | "rejected"; is_flagged: boolean; created_at: string;
  profiles: { display_name: string } | null; community_posts: { id: string; title: string } | null;
};

export default async function AdminCommunity({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const status = firstParam(sp.status) ?? "pending";
  const page = Math.max(1, toInt(firstParam(sp.page)) ?? 1);
  const supabase = await createClient();

  const head = () => supabase.from("community_posts").select("id", { count: "exact", head: true });
  const [pending, flagged, published, rejected, hidden, flaggedComments] = await Promise.all([
    head().eq("status", "pending"), head().eq("is_flagged", true), head().eq("status", "published"),
    head().eq("status", "rejected"), head().eq("status", "hidden"),
    supabase.from("community_comments").select("id", { count: "exact", head: true }).eq("is_flagged", true),
  ]);

  const tabs = [
    { value: "pending", label: "Pending posts", count: pending.count ?? 0 },
    { value: "flagged", label: "Flagged posts", count: flagged.count ?? 0 },
    { value: "published", label: "Published", count: published.count ?? 0 },
    { value: "rejected", label: "Rejected", count: rejected.count ?? 0 },
    { value: "hidden", label: "Hidden", count: hidden.count ?? 0 },
    { value: "comments", label: "Replies", count: flaggedComments.count ?? 0 },
  ];

  let body;
  let total = 0;
  if (status === "comments") {
    const { data, count } = await supabase
      .from("community_comments")
      .select("id,body,status,is_flagged,created_at,profiles(display_name),community_posts(id,title)", { count: "exact" })
      .order("is_flagged", { ascending: false })
      .order("created_at", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    total = count ?? 0;
    const rows = (data ?? []) as unknown as Comment[];
    body = rows.length === 0 ? <Panel><p className="px-5 py-12 text-center text-small text-ink-500">No replies.</p></Panel> : rows.map((c) => (
      <Panel key={c.id}>
        <div className="space-y-3 p-5">
          <div className="flex flex-wrap items-center gap-2 text-small">
            <StatusPill status={c.status} />
            {c.is_flagged ? <Badge tone="danger">Flagged</Badge> : null}
            <span className="font-semibold">{c.profiles?.display_name}</span>
            <span className="text-ink-500">on</span>
            <Link href={`/kg/community/post/${c.community_posts?.id}`} target="_blank" className="font-semibold text-brand-700 hover:underline">{c.community_posts?.title}</Link>
            <span className="text-ink-500">· {formatDateTime(c.created_at)}</span>
          </div>
          <p className="whitespace-pre-line text-small text-ink-700">{c.body}</p>
          <CommentActions comment={c} />
        </div>
      </Panel>
    ));
  } else {
    let query = supabase
      .from("community_posts")
      .select("id,title,body,status,is_flagged,flag_reason,is_pinned,moderation_note,created_at,comment_count,community_categories(name),profiles(display_name)", { count: "exact" });
    if (status === "flagged") query = query.eq("is_flagged", true);
    else query = query.eq("status", status as "pending");
    const { data, count } = await query.order("created_at", { ascending: status === "pending" }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    total = count ?? 0;
    const rows = (data ?? []) as unknown as Post[];
    body = rows.length === 0 ? <Panel><p className="px-5 py-12 text-center text-small text-ink-500">Nothing here.</p></Panel> : rows.map((p) => (
      <Panel key={p.id}>
        <div className="space-y-3 p-5">
          <div className="flex flex-wrap items-center gap-2 text-small">
            <StatusPill status={p.status} />
            {p.is_flagged ? <Badge tone="danger">Flagged{p.flag_reason ? `: ${p.flag_reason}` : ""}</Badge> : null}
            {p.is_pinned ? <Badge tone="warning">Pinned</Badge> : null}
            <Badge tone="brand">{p.community_categories?.name?.en}</Badge>
            <span className="text-ink-500">by {p.profiles?.display_name} · {formatDateTime(p.created_at)} · {p.comment_count} replies</span>
          </div>
          <h2 className="text-body font-semibold">{p.status === "published" ? <Link href={`/kg/community/post/${p.id}`} target="_blank" className="hover:text-brand-700">{p.title}</Link> : p.title}</h2>
          <p className="whitespace-pre-line text-small text-ink-700">{p.body}</p>
          {p.moderation_note ? <p className="rounded-control bg-warning-50 p-3 text-small"><strong>Moderator note:</strong> {p.moderation_note}</p> : null}
          <PostActions post={p} />
        </div>
      </Panel>
    ));
  }

  return (
    <AdminPage title="Community moderation" description="Posts are published only after approval. Replies are published instantly and can be hidden or removed.">
      <FilterTabs current={status} base="/admin/community" items={tabs} />
      <div className="space-y-4">{body}</div>
      <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))} hrefFor={(p) => `/admin/community?status=${status}&page=${p}`} prevLabel="Previous page" nextLabel="Next page" />
    </AdminPage>
  );
}
