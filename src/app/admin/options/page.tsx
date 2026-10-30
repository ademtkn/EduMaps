import { AdminPage, Panel, Table } from "@/components/admin/ui";
import { HiddenMark, OptionEditor, type OptionItem } from "@/components/admin/option-editor";
import { Alert } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "School options" };
export const dynamic = "force-dynamic";

export default async function AdminOptions() {
  const supabase = await createClient();
  const [systems, facilities, languages, feeItems, usage, feeUsage] = await Promise.all([
    supabase.from("education_systems").select("*").order("sort_order"),
    supabase.from("facility_types").select("*").order("sort_order"),
    supabase.from("language_options").select("*").order("sort_order"),
    supabase.from("fee_items").select("*").order("sort_order"),
    supabase.from("schools").select("education_systems,school_facilities(facility_key),school_languages(language_code)"),
    supabase.from("school_fee_items").select("item_key"),
  ]);
  const used = { system: new Map<string, number>(), facility: new Map<string, number>(), language: new Map<string, number>(), fee: new Map<string, number>() };
  for (const f of (feeUsage.data ?? []) as { item_key: string }[]) used.fee.set(f.item_key, (used.fee.get(f.item_key) ?? 0) + 1);
  for (const s of (usage.data ?? []) as unknown as { education_systems: string[]; school_facilities: { facility_key: string }[]; school_languages: { language_code: string }[] }[]) {
    s.education_systems.forEach((k) => used.system.set(k, (used.system.get(k) ?? 0) + 1));
    s.school_facilities.forEach((f) => used.facility.set(f.facility_key, (used.facility.get(f.facility_key) ?? 0) + 1));
    s.school_languages.forEach((l) => used.language.set(l.language_code, (used.language.get(l.language_code) ?? 0) + 1));
  }

  type Row = { key?: string; code?: string; name: OptionItem["name"]; sort_order: number; is_active: boolean; icon?: string };
  const section = (title: string, description: string, type: "system" | "facility" | "language" | "fee", rows: Row[]) => (
    <Panel title={title} actions={<OptionEditor type={type} />}>
      <p className="border-b border-ink-200 px-5 py-3 text-small text-ink-600">{description}</p>
      <Table head={["Name (EN)", "Kyrgyz", "Russian", "Key", "Used by", "Status", ""]}>
        {rows.map((r) => {
          const key = (r.key ?? r.code)!;
          return (
            <tr key={key} className={r.is_active ? undefined : "bg-ink-50 text-ink-500"}>
              <td className="px-4 py-3 font-semibold">{r.name.en}</td>
              <td className="px-4 py-3">{r.name.kg}</td>
              <td className="px-4 py-3">{r.name.ru}</td>
              <td className="px-4 py-3 font-mono text-caption">{key}</td>
              <td className="px-4 py-3">{used[type].get(key) ?? 0} schools</td>
              <td className="px-4 py-3">{r.is_active ? "Active" : <HiddenMark />}</td>
              <td className="px-4 py-3 text-right"><OptionEditor type={type} item={{ key, name: r.name, sort_order: r.sort_order, is_active: r.is_active, icon: r.icon }} /></td>
            </tr>
          );
        })}
      </Table>
    </Panel>
  );

  return (
    <AdminPage title="School options" description="The lists admins pick from when adding a school, and that visitors filter by. Changes appear on the site within seconds.">
      <Alert tone="info" title="What is fixed" className="mb-6">
        School type (public / private / international / specialized), the fee amount and how often it is paid, and the yes/no features <strong>Scholarships, Transportation and Boarding</strong> are built-in fields with their own filters. For any other yes/no feature (for example “Kindergarten on site” or “Halal meals”), add it as a <strong>facility</strong> below.
      </Alert>
      <div className="space-y-6">
        {section("Education systems", "Curricula a school can follow, e.g. National, IB, Cambridge.", "system", (systems.data ?? []) as unknown as Row[])}
        {section("Facilities", "Features shown as icons on the school page and compared side by side.", "facility", (facilities.data ?? []) as unknown as Row[])}
        {section("What the fee covers", "Items a school can mark as included in tuition or paid separately, e.g. meals, uniform, transport.", "fee", (feeItems.data ?? []) as unknown as Row[])}
        {section("Languages of instruction", "Languages a school teaches in (also used by the language filter).", "language", (languages.data ?? []) as unknown as Row[])}
      </div>
    </AdminPage>
  );
}
