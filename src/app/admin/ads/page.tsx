import { Plus } from "lucide-react";
import Link from "next/link";
import { AdminPage, formatDateTime, Panel, StatCard, Table } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/action-buttons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { setAdActiveAction } from "@/lib/actions/admin";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Advertisements" };
export const dynamic = "force-dynamic";

type Row = {
  id: string; advertiser_name: string; customer_type: string; placement: string; headline: { en?: string }; is_active: boolean;
  starts_at: string; ends_at: string | null; impressions: number; clicks: number; target_languages: string[];
};

function state(ad: Row): { label: string; tone: "success" | "warning" | "neutral" | "danger" } {
  const now = Date.now();
  if (!ad.is_active) return { label: "Paused", tone: "neutral" };
  if (new Date(ad.starts_at).getTime() > now) return { label: "Scheduled", tone: "warning" };
  if (ad.ends_at && new Date(ad.ends_at).getTime() <= now) return { label: "Ended", tone: "danger" };
  return { label: "Live", tone: "success" };
}

export default async function AdminAds() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("advertisements")
    .select("id,advertiser_name,customer_type,placement,headline,is_active,starts_at,ends_at,impressions,clicks,target_languages")
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as unknown as Row[];
  const impressions = rows.reduce((s, r) => s + Number(r.impressions), 0);
  const clicks = rows.reduce((s, r) => s + Number(r.clicks), 0);

  return (
    <AdminPage
      title="Advertisements"
      description="Internal ad system. Ads are always labelled and never affect rankings."
      actions={<Button asChild><Link href="/admin/ads/new"><Plus /> New campaign</Link></Button>}
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Live campaigns" value={rows.filter((r) => state(r).label === "Live").length} tone="leaf" />
        <StatCard label="Impressions" value={impressions.toLocaleString("en-GB")} />
        <StatCard label="Clicks" value={clicks.toLocaleString("en-GB")} hint={impressions ? `${((clicks / impressions) * 100).toFixed(2)}% click-through rate` : undefined} tone="warning" />
      </div>
      <Panel>
        <Table head={["Campaign", "Placement", "Status", "Schedule", "Impr.", "Clicks", "CTR", ""]} empty={rows.length === 0 ? "No campaigns yet." : undefined}>
          {rows.map((ad) => {
            const s = state(ad);
            return (
              <tr key={ad.id} className="hover:bg-ink-50">
                <td className="px-4 py-3"><Link href={`/admin/ads/${ad.id}`} className="font-semibold text-brand-700 hover:underline">{ad.headline.en}</Link><p className="text-caption text-ink-500">{ad.advertiser_name} · {ad.customer_type.replace(/_/g, " ")}</p></td>
                <td className="px-4 py-3 capitalize">{ad.placement.replace(/_/g, " ")}{ad.target_languages.length ? <span className="block text-caption uppercase text-ink-500">{ad.target_languages.join(" · ")}</span> : null}</td>
                <td className="px-4 py-3"><Badge tone={s.tone}>{s.label}</Badge></td>
                <td className="whitespace-nowrap px-4 py-3 text-caption text-ink-600">{formatDateTime(ad.starts_at)}<br />{ad.ends_at ? `→ ${formatDateTime(ad.ends_at)}` : "No end date"}</td>
                <td className="px-4 py-3">{Number(ad.impressions).toLocaleString("en-GB")}</td>
                <td className="px-4 py-3">{Number(ad.clicks).toLocaleString("en-GB")}</td>
                <td className="px-4 py-3">{ad.impressions ? `${((Number(ad.clicks) / Number(ad.impressions)) * 100).toFixed(2)}%` : "—"}</td>
                <td className="px-4 py-3"><div className="flex justify-end gap-2">
                  <ActionButton size="sm" variant="outline" action={setAdActiveAction} args={[ad.id, !ad.is_active]}>{ad.is_active ? "Pause" : "Resume"}</ActionButton>
                  <Button asChild size="sm" variant="ghost"><Link href={`/admin/ads/${ad.id}`}>Edit</Link></Button>
                </div></td>
              </tr>
            );
          })}
        </Table>
      </Panel>
    </AdminPage>
  );
}
