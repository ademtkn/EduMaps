import Link from "next/link";
import { AlertTriangle, Clock } from "lucide-react";
import { AdminPage, formatDateTime, Panel, StatCard } from "@/components/admin/ui";
import { DailyChart } from "@/components/admin/charts";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const [stats, daily, pendingReviews, pendingPosts, audit] = await Promise.all([
    supabase.rpc("admin_dashboard_stats"),
    supabase.rpc("admin_daily_events", { p_days: 14 }),
    supabase.from("reviews").select("id,title,rating,created_at,schools(name)").eq("status", "pending").order("created_at").limit(5),
    supabase.from("community_posts").select("id,title,created_at").eq("status", "pending").order("created_at").limit(5),
    supabase.from("audit_logs").select("id,action,entity_type,created_at,users(email)").order("created_at", { ascending: false }).limit(6),
  ]);
  const s = (stats.data ?? {}) as Record<string, number>;
  const days = (daily.data ?? []) as { day: string; event_type: string; total: number }[];
  const views = days.filter((d) => ["school_view", "article_view", "post_view"].includes(d.event_type));

  return (
    <AdminPage title="Dashboard" description="What needs attention and how the platform is doing.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Published schools" value={s.schools_published ?? 0} hint={`${s.schools_draft ?? 0} drafts / archived`} />
        <StatCard label="Registered users" value={s.users_total ?? 0} hint={`+${s.users_week ?? 0} this week`} tone="leaf" />
        <StatCard label="Reviews awaiting moderation" value={s.reviews_pending ?? 0} hint={`${s.reviews_published ?? 0} published`} tone="warning" />
        <StatCard label="Community posts awaiting" value={s.posts_pending ?? 0} hint={`${s.posts_published ?? 0} published`} tone="warning" />
        <StatCard label="Flagged items" value={s.flagged_items ?? 0} hint="Reviews, posts and comments" tone="danger" />
        <StatCard label="Articles published" value={s.articles_published ?? 0} tone="leaf" />
        <StatCard label="Live ad campaigns" value={s.ads_active ?? 0} />
        <StatCard label="Page views (7 days)" value={s.views_7d ?? 0} hint={`${s.searches_7d ?? 0} searches`} tone="leaf" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title="Views, last 14 days" className="xl:col-span-2">
          <div className="p-5"><DailyChart rows={views} days={14} /></div>
        </Panel>
        <Panel title="Recent admin activity">
          <ul className="divide-y divide-ink-200">
            {(audit.data ?? []).map((row) => (
              <li key={row.id} className="px-5 py-3 text-small">
                <p className="font-medium text-ink-900"><span className="capitalize">{row.action}</span> · {row.entity_type.replace(/_/g, " ")}</p>
                <p className="text-caption text-ink-500">{(row as unknown as { users: { email: string } | null }).users?.email ?? "system"} · {formatDateTime(row.created_at)}</p>
              </li>
            ))}
            {(audit.data ?? []).length === 0 ? <li className="px-5 py-8 text-center text-small text-ink-500">No activity yet.</li> : null}
          </ul>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Reviews waiting for approval" actions={<Button asChild size="sm" variant="outline"><Link href="/admin/reviews?status=pending">Open queue</Link></Button>}>
          <ul className="divide-y divide-ink-200">
            {(pendingReviews.data ?? []).map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-5 py-3 text-small">
                <Clock className="size-4 shrink-0 text-warning-500" />
                <div className="min-w-0 flex-1"><p className="truncate font-medium">{r.title}</p><p className="truncate text-caption text-ink-500">{(r as unknown as { schools: { name: { en?: string } } }).schools?.name?.en} · {r.rating}★</p></div>
              </li>
            ))}
            {(pendingReviews.data ?? []).length === 0 ? <li className="px-5 py-8 text-center text-small text-ink-500">All caught up.</li> : null}
          </ul>
        </Panel>
        <Panel title="Posts waiting for approval" actions={<Button asChild size="sm" variant="outline"><Link href="/admin/community?status=pending">Open queue</Link></Button>}>
          <ul className="divide-y divide-ink-200">
            {(pendingPosts.data ?? []).map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-5 py-3 text-small">
                <AlertTriangle className="size-4 shrink-0 text-warning-500" />
                <p className="min-w-0 flex-1 truncate font-medium">{p.title}</p>
              </li>
            ))}
            {(pendingPosts.data ?? []).length === 0 ? <li className="px-5 py-8 text-center text-small text-ink-500">All caught up.</li> : null}
          </ul>
        </Panel>
      </div>
    </AdminPage>
  );
}
