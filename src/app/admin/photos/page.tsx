import { AdminPage } from "@/components/admin/ui";
import { PhotoImporter } from "@/components/admin/photo-importer";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Bulk photos" };
export const dynamic = "force-dynamic";

type I18n = { kg?: string; ru?: string; en?: string } | null;
const text = (value: I18n, fallback = "") => value?.en || value?.ru || value?.kg || fallback;

/**
 * 619 published schools have no picture. Collecting them is field work; this screen makes the
 * sorting and uploading part quick: the file name points at the school, everything is checked
 * before a single byte is sent, and each upload is reported separately.
 */
export default async function BulkPhotosPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("schools").select("slug,name").order("slug").limit(1000);
  const schools = (data ?? []).map((row) => ({ slug: row.slug, name: text(row.name as I18n, row.slug) }));

  return (
    <AdminPage
      title="Bulk photos"
      description="Drop a folder of school photos here. The file name decides the school and the slot, so a batch can be checked before it is uploaded."
    >
      <PhotoImporter schools={schools} />
    </AdminPage>
  );
}
