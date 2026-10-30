import { Search } from "lucide-react";
import { AdminPage, FilterTabs, formatDateTime, Panel, Table } from "@/components/admin/ui";
import { UserActions } from "@/components/admin/user-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { createClient } from "@/lib/supabase/server";
import { firstParam, toInt } from "@/lib/utils";

export const metadata = { title: "Users" };
export const dynamic = "force-dynamic";
const PAGE_SIZE = 25;

type Row = { id: string; email: string; role: "user" | "moderator" | "admin"; is_banned: boolean; ban_reason: string | null; created_at: string; profiles: { display_name: string } | null };

export default async function AdminUsers({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const role = firstParam(sp.role) ?? "";
  const q = firstParam(sp.q)?.replace(/[%_\\(),]/g, " ").trim() ?? "";
  const page = Math.max(1, toInt(firstParam(sp.page)) ?? 1);
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  let query = supabase.from("users").select("id,email,role,is_banned,ban_reason,created_at,profiles(display_name)", { count: "exact" });
  if (role === "banned") query = query.eq("is_banned", true);
  else if (role) query = query.eq("role", role as "user");
  if (q) query = query.ilike("email", `%${q}%`);
  const { data, count } = await query.order("created_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const rows = (data ?? []) as unknown as Row[];

  return (
    <AdminPage title="Users" description="Manage roles and restrict accounts. Banned users can still read the site but cannot post.">
      <FilterTabs param="role" current={role} base="/admin/users" items={[{ value: "", label: "All" }, { value: "user", label: "Members" }, { value: "moderator", label: "Moderators" }, { value: "admin", label: "Admins" }, { value: "banned", label: "Banned" }]} />
      <form className="mb-4 flex max-w-md gap-2" role="search">
        {role ? <input type="hidden" name="role" value={role} /> : null}
        <label className="relative flex-1"><span className="sr-only">Search by email</span><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
          <input name="q" defaultValue={q} placeholder="Search by email…" className="h-11 w-full rounded-control border border-ink-300 bg-white pl-9 pr-3 text-small focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-100" /></label>
        <Button type="submit" variant="outline">Search</Button>
      </form>
      <Panel>
        <Table head={["User", "Role", "Joined", "Status", ""]} empty={rows.length === 0 ? "No users found." : undefined}>
          {rows.map((u) => (
            <tr key={u.id} className="hover:bg-ink-50">
              <td className="px-4 py-3"><p className="font-semibold">{u.profiles?.display_name}</p><p className="text-caption text-ink-500">{u.email}</p></td>
              <td className="px-4 py-3"><Badge tone={u.role === "admin" ? "brand" : u.role === "moderator" ? "leaf" : "neutral"} className="capitalize">{u.role}</Badge></td>
              <td className="whitespace-nowrap px-4 py-3 text-ink-600">{formatDateTime(u.created_at)}</td>
              <td className="px-4 py-3">{u.is_banned ? <Badge tone="danger" title={u.ban_reason ?? undefined}>Banned</Badge> : <Badge tone="success">Active</Badge>}</td>
              <td className="px-4 py-3"><UserActions user={u} isSelf={u.id === auth.user?.id} /></td>
            </tr>
          ))}
        </Table>
      </Panel>
      <Pagination page={page} totalPages={Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))} hrefFor={(p) => `/admin/users?${new URLSearchParams({ ...(role ? { role } : {}), ...(q ? { q } : {}), page: String(p) })}`} prevLabel="Previous page" nextLabel="Next page" />
    </AdminPage>
  );
}
