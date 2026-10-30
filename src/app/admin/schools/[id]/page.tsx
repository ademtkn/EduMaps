import { notFound } from "next/navigation";
import { z } from "zod";
import { AdminPage } from "@/components/admin/ui";
import { SchoolForm } from "@/components/admin/school-form";
import { loadSchoolOptions } from "@/lib/admin-options";
import { SCHOOL_WITH_CHILDREN, toFormValues } from "@/lib/admin-school-values";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Edit school" };
export const dynamic = "force-dynamic";

export default async function EditSchoolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const supabase = await createClient();
  const [{ data: s }, { data: cityRows }] = await Promise.all([
    supabase
      .from("schools")
      .select(SCHOOL_WITH_CHILDREN)
      .eq("id", id)
      .maybeSingle(),
    supabase.from("cities").select("id,name").order("sort_order"),
  ]);
  if (!s) notFound();

  const initial = toFormValues(s as never);

  return (
    <AdminPage title={(s.name as { en?: string }).en ?? "Edit school"} description="Changes are visible on the public site within seconds of saving.">
      <SchoolForm options={await loadSchoolOptions()} initial={initial} cities={(cityRows ?? []).map((c) => ({ id: c.id, name: (c.name as { en?: string }).en ?? "" }))} />
    </AdminPage>
  );
}
