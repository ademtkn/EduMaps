import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { SchoolOptions } from "@/components/admin/school-form";

type Row = { key: string; name: { en?: string }; is_active: boolean };
const toOption = (r: Row) => ({ key: r.key, label: `${r.name.en ?? r.key}${r.is_active ? "" : " (hidden)"}` });

/** Option lists for the school editor, including hidden ones so existing selections stay visible. */
export async function loadSchoolOptions(): Promise<SchoolOptions> {
  const supabase = await createClient();
  const [systems, languages, facilities, feeItems] = await Promise.all([
    supabase.from("education_systems").select("key,name,is_active").order("sort_order"),
    supabase.from("language_options").select("code,name,is_active").order("sort_order"),
    supabase.from("facility_types").select("key,name,is_active").order("sort_order"),
    supabase.from("fee_items").select("key,name,is_active").order("sort_order"),
  ]);
  return {
    systems: ((systems.data ?? []) as unknown as Row[]).map(toOption),
    languages: ((languages.data ?? []) as unknown as (Omit<Row, "key"> & { code: string })[]).map((r) => toOption({ ...r, key: r.code })),
    facilities: ((facilities.data ?? []) as unknown as Row[]).map(toOption),
    feeItems: ((feeItems.data ?? []) as unknown as Row[]).map(toOption),
  };
}
