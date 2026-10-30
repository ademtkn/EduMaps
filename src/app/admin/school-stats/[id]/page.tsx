import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { DailyChart, HBar } from "@/components/admin/charts";
import { AdminPage, Panel, StatCard } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { firstParam } from "@/lib/utils";

export const metadata = { title: "School statistics" };
export const dynamic = "force-dynamic";

const SECTION_LABEL: Record<string, string> = {
  overview: "Overview", about: "About the school", programs: "Programs", languages: "Languages", facilities: "Facilities", activities: "Sports and clubs",
  tuition: "Tuition and what it covers", transportation: "Transportation and boarding", documents: "Documents", gallery: "Photo gallery", videos: "Videos", location: "Location and map",
  reviews: "Reviews", faq: "Questions and answers",
};
const SOURCE_LABEL: Record<string, string> = {
  direct: "Typed or bookmarked", home: "Home page", directory: "School list", map: "Map", compare: "Comparison", city: "City or region page",
  education: "Education Hub", community: "Community", other_school: "Another school page", search_engine: "Search engine", external: "Another website", internal: "Other page on the site", unknown: "Unknown",
};
const TIME_LABEL: Record<string, string> = { lt10: "Under 10 seconds", s10_30: "10 to 30 seconds", s30_120: "30 seconds to 2 minutes", gt120: "More than 2 minutes" };
const LANG_LABEL: Record<string, string> = { kg: "Kyrgyz", ru: "Russian", en: "English", unknown: "Unknown" };

type Detail = {
  daily: { day: string; views: number; contacts: number }[]; by_lang: Record<string, number>; sources: Record<string, number>; sections: Record<string, number>;
  time: Record<string, number>; contacts: Record<string, number>; compare_adds: number; favorites: number; views: number;
};

export default async function SchoolStatsDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const sp = await searchParams;
  const requested = Number(firstParam(sp.days));
  const days = [7, 30, 90].includes(requested) ? requested : 30;
  const supabase = await createClient();
  const [{ data: school }, { data: raw }] = await Promise.all([
    supabase.from("schools").select("id,slug,name,whatsapp,phone,cities(name)").eq("id", id).maybeSingle(),
    supabase.rpc("admin_school_stats_detail", { p_school: id, p_days: days }),
  ]);
  if (!school) notFound();
  const d = raw as unknown as Detail;
  const c = (k: string) => Number(d.contacts[k] ?? 0);
  const views = Number(d.views);
  const pct = (n: number) => (views > 0 ? `${Math.round((n / views) * 100)}% of views` : undefined);
  const items = (map: Record<string, number>, labels: Record<string, string>, order?: string[], sub?: (n: number) => string | undefined) =>
    (order ?? Object.keys(map)).filter((k) => map[k] != null || order).map((k) => ({ label: labels[k] ?? k, value: Number(map[k] ?? 0), sub: sub?.(Number(map[k] ?? 0)) }));

  return (
    <AdminPage
      title={(school.name as { en?: string }).en ?? "School"}
      description={`Last ${days} days. Anonymous counts, the same for every school. A WhatsApp or phone press means the visitor opened the chat or call; the site cannot see whether a message was sent.`}
      actions={<div className="flex gap-2"><Button asChild variant="outline"><Link href={`/admin/school-stats?days=${days}`}>All schools</Link></Button><Button asChild variant="outline"><Link href={`/admin/schools/${id}`}>Edit school</Link></Button></div>}
    >
      <div className="mb-4 flex flex-wrap gap-2 text-small">
        {[7, 30, 90].map((r) => (
          <Link key={r} href={`/admin/school-stats/${id}?days=${r}`} className={`rounded-full border px-3.5 py-1.5 font-semibold ${days === r ? "border-brand-700 bg-brand-700 text-white" : "border-ink-200 bg-white text-ink-700 hover:border-brand-300"}`}>Last {r} days</Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Page views" value={views} />
        <StatCard label="WhatsApp opened" value={c("whatsapp")} tone="leaf" hint={school.whatsapp ? pct(c("whatsapp")) : "No WhatsApp number set for this school"} />
        <StatCard label="Phone pressed" value={c("phone")} tone="leaf" hint={pct(c("phone"))} />
        <StatCard label="Email pressed" value={c("email")} tone="leaf" hint={pct(c("email"))} />
        <StatCard label="Website opened" value={c("website")} tone="warning" hint={pct(c("website"))} />
        <StatCard label="Directions and maps" value={c("directions") + c("google_maps") + c("gis2")} tone="warning" hint={`Directions ${c("directions")} · Google Maps ${c("google_maps")} · 2GIS ${c("gis2")}`} />
        <StatCard label="Shared on WhatsApp" value={c("share")} tone="warning" />
        <StatCard label="Documents opened" value={c("document")} tone="warning" hint={pct(c("document"))} />
        <StatCard label="Added to comparison / saved" value={`${Number(d.compare_adds)} / ${Number(d.favorites)}`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Views per day"><div className="p-5"><DailyChart rows={d.daily.map((r) => ({ day: r.day, total: Number(r.views) }))} days={days} /></div></Panel>
        <Panel title="WhatsApp, phone and email presses per day"><div className="p-5"><DailyChart rows={d.daily.map((r) => ({ day: r.day, total: Number(r.contacts) }))} days={days} /></div></Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="What visitors looked at"><div className="space-y-3 p-5">
          <p className="text-caption text-ink-500">How many visits scrolled each part into view. A section the visitor never reached is not counted.</p>
          <HBar items={items(d.sections, SECTION_LABEL, Object.keys(SECTION_LABEL), (n) => (views > 0 ? `${Math.min(100, Math.round((n / views) * 100))}%` : undefined))} />
        </div></Panel>
        <Panel title="How long the page stayed open"><div className="space-y-3 p-5">
          <p className="text-caption text-ink-500">Time with the page visible, reported when the visitor left. Short visits are common and not a problem by themselves.</p>
          <HBar items={items(d.time, TIME_LABEL, Object.keys(TIME_LABEL))} />
        </div></Panel>
        <Panel title="Where visits came from"><div className="p-5"><HBar items={items(d.sources, SOURCE_LABEL).sort((a, b) => b.value - a.value)} /></div></Panel>
        <Panel title="Language of the visit"><div className="p-5"><HBar items={items(d.by_lang, LANG_LABEL).sort((a, b) => b.value - a.value)} /></div></Panel>
      </div>
    </AdminPage>
  );
}
