import { AdminPage } from "@/components/admin/ui";
import { SchoolForm } from "@/components/admin/school-form";
import { EMPTY_SCHOOL } from "@/lib/admin-defaults";
import { loadSchoolOptions } from "@/lib/admin-options";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "New school" };
export const dynamic = "force-dynamic";

export default async function NewSchoolPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("cities").select("id,name").order("sort_order");
  const cities = (data ?? []).map((c) => ({ id: c.id, name: (c.name as { en?: string }).en ?? "" }));
  return (
    <AdminPage title="New school" description="Fill in at least the English name, city and address. Add Kyrgyz and Russian text so every visitor sees the right language.">
      <SchoolForm options={await loadSchoolOptions()} initial={EMPTY_SCHOOL} cities={cities} />
    </AdminPage>
  );
}
