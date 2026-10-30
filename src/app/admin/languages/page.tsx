import { AdminPage, Panel } from "@/components/admin/ui";
import { LanguageToggle } from "@/components/admin/language-toggle";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Languages" };
export const dynamic = "force-dynamic";

type Coverage = Record<string, { schools_total: number; schools_name: number; schools_about: number; articles_total: number; articles_title: number; articles_body: number }>;

function Meter({ label, done, total }: { label: string; done: number; total: number }) {
  const pct = total ? Math.round((done / total) * 100) : 100;
  return (
    <div>
      <div className="mb-1 flex justify-between text-caption"><span className="text-ink-600">{label}</span><span className="font-semibold text-ink-800">{done}/{total} · {pct}%</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-ink-100"><div className={pct === 100 ? "h-full bg-leaf-500" : "h-full bg-warning-500"} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

export default async function AdminLanguages() {
  const supabase = await createClient();
  const [{ data: languages }, { data: coverage }] = await Promise.all([
    supabase.from("languages").select("*").order("sort_order"),
    supabase.rpc("translation_coverage"),
  ]);
  const cov = (coverage ?? {}) as Coverage;

  return (
    <AdminPage title="Languages" description="Enable or hide site languages and see how complete each translation is. Disabled languages disappear from the language switcher and sitemap.">
      <div className="grid gap-6 lg:grid-cols-3">
        {(languages ?? []).map((l) => {
          const c = cov[l.code];
          return (
            <Panel key={l.code}>
              <div className="flex items-start justify-between gap-3 border-b border-ink-200 p-5">
                <div>
                  <h2 className="text-h3 font-semibold">{l.native_name}</h2>
                  <p className="text-small text-ink-600">{l.name} · <code>/{l.code}/</code> · html lang <code>{l.html_lang}</code></p>
                  {l.is_default ? <Badge tone="brand" className="mt-2">Default</Badge> : null}
                </div>
                <LanguageToggle code={l.code} enabled={l.is_enabled} locked={l.is_default} />
              </div>
              {c ? (
                <div className="space-y-4 p-5">
                  <Meter label="School names" done={c.schools_name} total={c.schools_total} />
                  <Meter label="School descriptions" done={c.schools_about} total={c.schools_total} />
                  <Meter label="Article titles" done={c.articles_title} total={c.articles_total} />
                  <Meter label="Article bodies" done={c.articles_body} total={c.articles_total} />
                </div>
              ) : null}
            </Panel>
          );
        })}
      </div>
      <p className="mt-6 text-small text-ink-600">Interface strings live in <code>src/lib/i18n/dictionaries/*.json</code>. Content in the database falls back to the closest available language when a translation is missing.</p>
    </AdminPage>
  );
}
