import Link from "next/link";
import { AdminPage } from "@/components/admin/ui";
import { PinWorkbench, type PinItem } from "@/components/admin/pin-workbench";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Map pins" };
export const dynamic = "force-dynamic";

/** How many profiles one pass walks through. Reloading continues with the next batch. */
const BATCH = 80;

type I18n = { kg?: string; ru?: string; en?: string } | null;

const text = (value: I18n, fallback = "") => value?.en || value?.ru || value?.kg || fallback;

export default async function MapPinsPage() {
  const supabase = await createClient();
  const { data, count } = await supabase
    .from("admin_school_completeness")
    .select("id,name,city_name,address,twogis_url,google_maps_url", { count: "exact" })
    .eq("status", "published")
    .eq("has_location", false)
    .order("updated_at", { ascending: false })
    .limit(BATCH);

  const items: PinItem[] = (data ?? []).map((row) => ({
    id: row.id,
    name: text(row.name as I18n, row.id),
    city: text(row.city_name as I18n),
    address: text(row.address as I18n),
    twogisUrl: row.twogis_url,
    googleUrl: row.google_maps_url,
  }));

  return (
    <AdminPage
      title="Map pins"
      description="Published schools without coordinates. Paste the share link from Google Maps or 2GIS (or type the coordinates), check the preview and save; the workbench moves to the next school."
      actions={<Button asChild variant="outline"><Link href="/admin/schools?gap=location">Open the filtered list</Link></Button>}
    >
      <p className="mb-4 text-small text-ink-600">
        {count ?? 0} published school(s) have no pin. This pass shows up to {BATCH}; reload for the next batch.
      </p>
      <PinWorkbench items={items} />
    </AdminPage>
  );
}
