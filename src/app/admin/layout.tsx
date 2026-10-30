import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminProviders } from "@/components/admin/admin-providers";
import { createClient } from "@/lib/supabase/server";
import "../globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic", "cyrillic-ext"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Admin | EduMaps.kg", template: "%s | EduMaps.kg Admin" },
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/kg/auth/login?next=/admin");

  const { data: account } = await supabase.from("users").select("role,is_banned").eq("id", auth.user.id).maybeSingle();
  if (!account || account.is_banned || (account.role !== "admin" && account.role !== "moderator")) redirect("/kg");
  const role = account.role as "admin" | "moderator";

  // Pending-work counters shown next to navigation items.
  const [reviews, posts, messages, corrections, opinions] = await Promise.all([
    supabase.from("reviews").select("id", { count: "exact", head: true }).or("status.eq.pending,is_flagged.eq.true"),
    supabase.from("community_posts").select("id", { count: "exact", head: true }).or("status.eq.pending,is_flagged.eq.true"),
    supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("correction_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("site_testimonials").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-dvh bg-ink-50">
        <AdminProviders>
          <div className="flex min-h-dvh flex-col lg:flex-row">
            <AdminNav role={role} email={auth.user.email ?? ""} badges={{ "/admin/reviews": reviews.count ?? 0, "/admin/community": posts.count ?? 0, "/admin/messages": messages.count ?? 0, "/admin/corrections": corrections.count ?? 0, "/admin/testimonials": opinions.count ?? 0 }} />
            <main className="min-w-0 flex-1">{children}</main>
          </div>
        </AdminProviders>
      </body>
    </html>
  );
}
