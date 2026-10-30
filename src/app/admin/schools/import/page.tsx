import { Download, FileSpreadsheet } from "lucide-react";
import { SchoolImporter } from "@/components/admin/school-importer";
import { AdminPage, Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { COLUMNS } from "@/lib/import/schools";
import { loadLookups } from "@/lib/import/server";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Import schools" };
export const dynamic = "force-dynamic";

export default async function ImportSchoolsPage() {
  const supabase = await createClient();
  const lookups = await loadLookups(supabase);
  const groups = [...new Set(COLUMNS.map((c) => c.group))];
  const list = (items: { key: string; names: string[] }[]) => (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((i) => <li key={i.key} className="rounded-md bg-ink-100 px-2 py-0.5 font-mono text-caption" title={i.names.join(" / ")}>{i.key}</li>)}
    </ul>
  );

  return (
    <AdminPage
      title="Import schools"
      description="Add or update many schools at once from a spreadsheet. Fill the template in Excel or Google Sheets, save it as CSV, and upload it here."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline"><a href="/admin/schools/import/template" download><Download /> Download the template</a></Button>
          <Button asChild variant="outline"><a href="/admin/schools/export" download><FileSpreadsheet /> Export all schools</a></Button>
        </div>
      }
    >
      <div className="space-y-6">
        <Panel title="How it works">
          <ol className="list-decimal space-y-2 p-5 pl-9 text-small text-ink-700">
            <li>Download the template. Each school is one row. Delete the two example rows before you import (they are marked as demo).</li>
            <li>Fill in the columns you have. Only <strong>name_en</strong>, <strong>city</strong> and <strong>school_type</strong> are required for a new school; leave any other cell empty if you do not know the answer. Empty is better than a guess.</li>
            <li>Save as <strong>CSV UTF-8</strong> (in Excel: File, Save as, CSV UTF-8). Semicolon-separated files from Russian-language Excel work too.</li>
            <li>Upload it, check the result, then import. Rows with errors are never saved, and you see exactly what is wrong with each.</li>
            <li>To correct many schools at once, click <strong>Export all schools</strong>, edit the file, and import it back with “Update them from the file”. Only filled-in cells change anything.</li>
          </ol>
          <p className="border-t border-ink-200 px-5 py-3 text-caption text-ink-500">Photos are not uploaded here. Add them to each school afterwards, and only with the school&apos;s permission. Up to 300 schools and 2 MB per file.</p>
        </Panel>

        <SchoolImporter />

        <Panel title="Columns">
          <div className="space-y-6 p-5">
            {groups.map((group) => (
              <section key={group}>
                <h3 className="mb-2 text-small font-semibold text-ink-900">{group}</h3>
                <dl className="divide-y divide-ink-100 rounded-card border border-ink-200 text-small">
                  {COLUMNS.filter((c) => c.group === group).map((c) => (
                    <div key={c.key} className="grid gap-1 px-4 py-2.5 sm:grid-cols-[13rem_1fr]">
                      <dt className="font-mono text-caption font-semibold text-ink-900">{c.key}{c.required ? <span className="ml-1 text-danger-600">*</span> : null}</dt>
                      <dd className="text-ink-700">{c.help}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
        </Panel>

        <Panel title="Values you can use">
          <div className="space-y-5 p-5 text-small">
            <div><h3 className="mb-2 font-semibold">city</h3>{list(lookups.cities)}</div>
            <div><h3 className="mb-2 font-semibold">school_type</h3><p className="text-ink-700">public, private, international, specialized</p></div>
            <div><h3 className="mb-2 font-semibold">education_systems</h3>{list(lookups.systems)}</div>
            <div><h3 className="mb-2 font-semibold">languages</h3>{list(lookups.languages)}</div>
            <div><h3 className="mb-2 font-semibold">facilities</h3>{list(lookups.facilities)}</div>
            <div><h3 className="mb-2 font-semibold">fee_items</h3>{list(lookups.feeItems)}<p className="mt-2 text-ink-600">Example: <span className="font-mono text-caption">meals:included; uniform:5000/one_time; transport:4500/month; books:paid</span></p></div>
            <p className="text-ink-600">Names in Kyrgyz, Russian and English are accepted wherever a key is listed. Add new cities, systems, facilities and fee items under <a href="/admin/options" className="font-semibold text-brand-700 hover:underline">School options</a> first.</p>
          </div>
        </Panel>
      </div>
    </AdminPage>
  );
}
