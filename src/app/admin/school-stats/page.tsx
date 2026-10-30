import Link from "next/link";
import { AdminPage, Panel, Table } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import { firstParam } from "@/lib/utils";

export const metadata = { title: "School statistics" };
export const dynamic = "force-dynamic";

const RANGES = [7, 30, 90] as const;

type Stat = { school_id: string; views: number; whatsapp: number; phone: number; email: number; website: number; directions: number; shares: number; compare_adds: number; favorites: number };

export default async function AdminSchoolStats({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const requested = Number(firstParam(sp.days));
  const days = (RANGES as readonly number[]).includes(requested) ? requested : 30;
  const sort = ["views", "whatsapp", "phone", "contacts"].includes(firstParam(sp.sort) ?? "") ? firstParam(sp.sort)! : "views";
  const supabase = await createClient();
  const [{ data: stats }, { data: schools }] = await Promise.all([
    supabase.rpc("admin_school_stats", { p_days: days }),
    supabase.from("schools").select("id,name,data_status,cities(name)").eq("status", "published"),
  ]);
  const byId = new Map((schools ?? []).map((s) => [s.id, s as unknown as { id: string; name: { en?: string }; data_status: string; cities: { name: { en?: string } } | null }]));
  const num = (v: unknown) => Number(v ?? 0);
  const rows = ((stats ?? []) as Stat[])
    .map((r) => ({ ...r, contacts: num(r.whatsapp) + num(r.phone) + num(r.email) }))
    .sort((a, b) => num(b[sort as "views"]) - num(a[sort as "views"]) || num(b.views) - num(a.views));
  const total = (key: keyof Stat) => rows.reduce((s, r) => s + num(r[key]), 0);
  const href = (patch: Record<string, string>) => `/admin/school-stats?${new URLSearchParams({ days: String(days), sort, ...patch })}`;

  return (
    <AdminPage
      title="School statistics"
      description="The same anonymous figures for every school: page views, contact buttons pressed, and interest. Only administrators see them. Counts are people who pressed a button; the site cannot see whether a message was then sent."
    >
      <div className="mb-4 flex flex-wrap items-center gap-2 text-small">
        <span className="text-ink-600">Period:</span>
        {RANGES.map((r) => (
          <Link key={r} href={href({ days: String(r) })} aria-current={days === r ? "page" : undefined}
            className={`rounded-full border px-3.5 py-1.5 font-semibold ${days === r ? "border-brand-700 bg-brand-700 text-white" : "border-ink-200 bg-white text-ink-700 hover:border-brand-300"}`}>
            Last {r} days
          </Link>
        ))}
        <span className="ml-3 text-ink-600">Sort by:</span>
        {([["views", "Views"], ["whatsapp", "WhatsApp"], ["phone", "Phone"], ["contacts", "All contacts"]] as const).map(([key, label]) => (
          <Link key={key} href={href({ sort: key })} aria-current={sort === key ? "page" : undefined}
            className={`rounded-full border px-3.5 py-1.5 font-semibold ${sort === key ? "border-brand-700 bg-brand-700 text-white" : "border-ink-200 bg-white text-ink-700 hover:border-brand-300"}`}>
            {label}
          </Link>
        ))}
      </div>
      <Panel>
        <Table head={["School", "Views", "WhatsApp", "Phone", "Email", "Website", "Maps", "Shared", "Compared", "Saved", "Contact rate"]} empty={rows.length === 0 ? "No data yet." : undefined}>
          {rows.map((r) => {
            const s = byId.get(r.school_id);
            const rate = num(r.views) > 0 ? `${Math.round((r.contacts / num(r.views)) * 100)}%` : "—";
            return (
              <tr key={r.school_id} className="hover:bg-ink-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/school-stats/${r.school_id}?days=${days}`} className="font-semibold text-brand-700 hover:underline">{s?.name.en ?? r.school_id}</Link>
                  <p className="text-caption text-ink-500">{s?.cities?.name?.en}{s?.data_status === "demo" ? " · demo" : ""}</p>
                </td>
                <td className="px-4 py-3 font-semibold">{num(r.views)}</td>
                <td className="px-4 py-3">{num(r.whatsapp)}</td>
                <td className="px-4 py-3">{num(r.phone)}</td>
                <td className="px-4 py-3">{num(r.email)}</td>
                <td className="px-4 py-3">{num(r.website)}</td>
                <td className="px-4 py-3">{num(r.directions)}</td>
                <td className="px-4 py-3">{num(r.shares)}</td>
                <td className="px-4 py-3">{num(r.compare_adds)}</td>
                <td className="px-4 py-3">{num(r.favorites)}</td>
                <td className="px-4 py-3">{rate}</td>
              </tr>
            );
          })}
          {rows.length ? (
            <tr className="bg-ink-50 font-semibold">
              <td className="px-4 py-3">All schools</td>
              {(["views", "whatsapp", "phone", "email", "website", "directions", "shares", "compare_adds", "favorites"] as const).map((k) => <td key={k} className="px-4 py-3">{total(k)}</td>)}
              <td className="px-4 py-3">{total("views") > 0 ? `${Math.round(((total("whatsapp") + total("phone") + total("email")) / total("views")) * 100)}%` : "—"}</td>
            </tr>
          ) : null}
        </Table>
      </Panel>
      <p className="mt-3 text-caption text-ink-500">Contact rate = WhatsApp, phone and email presses divided by page views. Each visitor is counted once per button per browser session.</p>
    </AdminPage>
  );
}
