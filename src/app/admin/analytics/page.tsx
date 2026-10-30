import { AdminPage, Panel, StatCard, Table } from "@/components/admin/ui";
import { DailyChart, HBar } from "@/components/admin/charts";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Analytics" };
export const dynamic = "force-dynamic";

const EVENT_LABEL: Record<string, string> = {
  school_view: "School views", article_view: "Article views", post_view: "Post views", search: "Searches", map_open: "Map opens",
  compare: "Comparisons", ad_impression: "Ad impressions", ad_click: "Ad clicks",
};

export default async function AdminAnalytics() {
  const supabase = await createClient();
  const [daily, breakdown, topSchools, topArticles, ads, reviews] = await Promise.all([
    supabase.rpc("admin_daily_events", { p_days: 30 }),
    supabase.rpc("admin_event_breakdown", { p_days: 30 }),
    supabase.from("schools").select("id,name,view_count,rating_avg,rating_count,cities(name)").eq("status", "published").order("view_count", { ascending: false }).limit(8),
    supabase.from("articles").select("id,title,view_count").eq("status", "published").order("view_count", { ascending: false }).limit(6),
    supabase.from("advertisements").select("id,headline,advertiser_name,impressions,clicks").order("impressions", { ascending: false }).limit(6),
    supabase.from("reviews").select("rating").eq("status", "published"),
  ]);

  const days = (daily.data ?? []) as { day: string; event_type: string; total: number }[];
  const rows = (breakdown.data ?? []) as { event_type: string; lang: string; total: number }[];
  const totalBy = (type: string) => rows.filter((r) => r.event_type === type).reduce((s, r) => s + Number(r.total), 0);
  const pageViews = days.filter((d) => ["school_view", "article_view", "post_view"].includes(d.event_type));
  const langTotals = ["kg", "ru", "en"].map((code) => ({
    label: { kg: "Kyrgyz", ru: "Russian", en: "English" }[code]!,
    value: rows.filter((r) => r.lang === code && ["school_view", "article_view", "post_view"].includes(r.event_type)).reduce((s, r) => s + Number(r.total), 0),
  }));
  const distribution = [5, 4, 3, 2, 1].map((n) => ({ label: `${n} stars`, value: (reviews.data ?? []).filter((r) => r.rating === n).length }));

  return (
    <AdminPage title="Analytics" description="Last 30 days. Counts are first-party and anonymous: no cookies, no personal data.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Content views" value={totalBy("school_view") + totalBy("article_view") + totalBy("post_view")} hint={`${totalBy("school_view")} school pages`} />
        <StatCard label="Searches" value={totalBy("search")} tone="leaf" />
        <StatCard label="Map opens" value={totalBy("map_open")} tone="leaf" />
        <StatCard label="Comparisons" value={totalBy("compare")} tone="warning" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title="Views per day" className="xl:col-span-2"><div className="p-5"><DailyChart rows={pageViews} days={30} /></div></Panel>
        <Panel title="Views by language"><div className="p-5"><HBar items={langTotals} /></div></Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Most viewed schools">
          <Table head={["School", "City", "Views", "Rating"]}>
            {(topSchools.data ?? []).map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-medium">{(s.name as { en?: string }).en}</td>
                <td className="px-4 py-3">{(s as unknown as { cities: { name: { en?: string } } }).cities?.name?.en}</td>
                <td className="px-4 py-3">{Number(s.view_count)}</td>
                <td className="px-4 py-3">{s.rating_count ? `${s.rating_avg} (${s.rating_count})` : "—"}</td>
              </tr>
            ))}
          </Table>
        </Panel>
        <Panel title="Review ratings"><div className="p-5"><HBar items={distribution} /></div></Panel>
        <Panel title="Top articles">
          <Table head={["Article", "Views"]}>
            {(topArticles.data ?? []).map((a) => <tr key={a.id}><td className="px-4 py-3 font-medium">{(a.title as { en?: string }).en}</td><td className="px-4 py-3">{Number(a.view_count)}</td></tr>)}
          </Table>
        </Panel>
        <Panel title="Ad performance">
          <Table head={["Campaign", "Impr.", "Clicks", "CTR"]}>
            {(ads.data ?? []).map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-3"><p className="font-medium">{(a.headline as { en?: string }).en}</p><p className="text-caption text-ink-500">{a.advertiser_name}</p></td>
                <td className="px-4 py-3">{Number(a.impressions)}</td><td className="px-4 py-3">{Number(a.clicks)}</td>
                <td className="px-4 py-3">{Number(a.impressions) ? `${((Number(a.clicks) / Number(a.impressions)) * 100).toFixed(2)}%` : "—"}</td>
              </tr>
            ))}
          </Table>
        </Panel>
      </div>
      <p className="mt-6 text-caption text-ink-500">{Object.entries(EVENT_LABEL).map(([k, l]) => `${l}: ${totalBy(k)}`).join(" · ")}</p>
    </AdminPage>
  );
}
