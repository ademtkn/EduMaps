import { redirect } from "next/navigation";
import { AdminPage, FilterTabs } from "@/components/admin/ui";
import { OutreachList, type OutreachListItem } from "@/components/admin/outreach-list";
import { createClient } from "@/lib/supabase/server";
import { firstParam, SITE_URL } from "@/lib/utils";

export const metadata = { title: "School outreach" };
export const dynamic = "force-dynamic";

type Row = {
  id: string; slug: string; name: { kg?: string; ru?: string; en: string }; phone: string | null; email: string | null; whatsapp: string | null; data_status: string;
  cities: { name: { en?: string } } | null;
  school_outreach: { status: "sent" | "replied" | "confirmed" | "declined"; channel: "whatsapp" | "email" | "both" | null; note: string | null } | null;
};

export default async function AdminOutreach({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const status = firstParam(sp.status) ?? "todo";
  const supabase = await createClient();

  // Administrators only: the campaign status is hidden from moderators by the database, so a moderator would see every school as "not contacted".
  const { data: auth } = await supabase.auth.getUser();
  const account = auth.user ? (await supabase.from("users").select("role").eq("id", auth.user.id).maybeSingle()).data : null;
  if (account?.role !== "admin") redirect("/admin");

  // Sample schools (data_status "demo") are fictional and must never be contacted.
  const { data } = await supabase
    .from("schools")
    .select("id,slug,name,phone,email,whatsapp,data_status,cities(name),school_outreach(status,channel,note)")
    .eq("status", "published")
    .neq("data_status", "demo")
    .order("name->>en", { ascending: true });
  const rows = (data ?? []) as unknown as Row[];

  const count = (s: string) => rows.filter((r) => (s === "todo" ? !r.school_outreach : r.school_outreach?.status === s)).length;
  const shown = rows.filter((r) => status === "all" || (status === "todo" ? !r.school_outreach : r.school_outreach?.status === status));

  const items: OutreachListItem[] = shown.map((r) => ({
    id: r.id, slug: r.slug, baseUrl: SITE_URL, city: r.cities?.name.en ?? "", dataStatus: r.data_status,
    name: { en: r.name.en, ru: r.name.ru ?? r.name.en, kg: r.name.kg ?? r.name.ru ?? r.name.en },
    whatsapp: r.whatsapp, phone: r.phone, email: r.email, outreach: r.school_outreach,
  }));

  return (
    <AdminPage
      title="School outreach"
      description="Introduction messages for schools in Russian, Kyrgyz and English, filled in for each school. Send them yourself, one school at a time, then record the result here. Fictional sample schools are not listed."
    >
      {/localhost|127\.0\.0\.1|^http:/.test(SITE_URL) ? (
        <p role="alert" className="mb-5 rounded-card border border-warning-500 bg-warning-50 px-4 py-3 text-small text-warning-700">
          The school links in these messages point to <strong>{SITE_URL}</strong>, an address nobody outside this computer can open. Do not send them yet: set <code>NEXT_PUBLIC_SITE_URL</code> to the real address (https://edumaps.kg) on the live server.
        </p>
      ) : null}
      <FilterTabs
        current={status}
        base="/admin/outreach"
        items={[
          { value: "todo", label: "Not contacted", count: count("todo") },
          { value: "sent", label: "Sent", count: count("sent") },
          { value: "replied", label: "Replied", count: count("replied") },
          { value: "confirmed", label: "Confirmed", count: count("confirmed") },
          { value: "declined", label: "Declined", count: count("declined") },
          { value: "all", label: "All", count: rows.length },
        ]}
      />
      <OutreachList items={items} />
    </AdminPage>
  );
}
