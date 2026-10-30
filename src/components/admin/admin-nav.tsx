"use client";

import {
  BarChart3, BookOpen, Flag, LineChart, Quote, Folder, Globe, Image as ImageIcon, Inbox, LayoutDashboard, Megaphone, Menu, MessagesSquare,
  ScrollText, School, Send, SlidersHorizontal, Star, Users, Video, X, type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; icon: LucideIcon; roles: ("admin" | "moderator")[]; exact?: boolean; query?: string };

const GROUPS: { title: string; items: Item[] }[] = [
  { title: "Overview", items: [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "moderator"], exact: true },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3, roles: ["admin"] },
    { href: "/admin/school-stats", label: "School statistics", icon: LineChart, roles: ["admin"] },
  ] },
  { title: "Content", items: [
    { href: "/admin/schools", label: "Schools", icon: School, roles: ["admin"] },
    { href: "/admin/articles", label: "Articles", icon: BookOpen, roles: ["admin"] },
    { href: "/admin/videos", label: "Videos", icon: Video, roles: ["admin"] },
    { href: "/admin/categories", label: "Categories", icon: Folder, roles: ["admin"] },
    { href: "/admin/options", label: "School options", icon: SlidersHorizontal, roles: ["admin"] },
    { href: "/admin/media", label: "Media files", icon: ImageIcon, roles: ["admin"] },
  ] },
  { title: "Moderation", items: [
    { href: "/admin/reviews", label: "Reviews", icon: Star, roles: ["admin", "moderator"] },
    { href: "/admin/community", label: "Community", icon: MessagesSquare, roles: ["admin", "moderator"] },
    { href: "/admin/messages", label: "Messages", icon: Inbox, roles: ["admin", "moderator"] },
  ] },
  { title: "Requests", items: [
    { href: "/admin/corrections", label: "Corrections", icon: Flag, roles: ["admin", "moderator"] },
    { href: "/admin/testimonials", label: "Site opinions", icon: Quote, roles: ["admin"] },
  ] },
  { title: "Business", items: [
    { href: "/admin/ads", label: "Advertisements", icon: Megaphone, roles: ["admin"] },
    { href: "/admin/outreach", label: "School outreach", icon: Send, roles: ["admin"] },
  ] },
  { title: "System", items: [
    { href: "/admin/users", label: "Users", icon: Users, roles: ["admin"] },
    { href: "/admin/languages", label: "Languages", icon: Globe, roles: ["admin"] },
    { href: "/admin/audit", label: "Audit log", icon: ScrollText, roles: ["admin"] },
  ] },
];

export function AdminNav({ role, email, badges }: { role: "admin" | "moderator"; email: string; badges: Record<string, number> }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav aria-label="Admin" className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
      {GROUPS.map((group) => {
        const items = group.items.filter((i) => i.roles.includes(role));
        if (!items.length) return null;
        return (
          <div key={group.title}>
            <p className="mb-1.5 px-3 text-caption font-semibold uppercase tracking-wide text-brand-300">{group.title}</p>
            <ul className="space-y-0.5">
              {items.map((item) => {
                const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
                const badge = badges[item.href];
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-control px-3 py-2.5 text-small font-medium transition-colors",
                        active ? "bg-white/15 text-white" : "text-brand-100 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <item.icon className="size-4.5" />
                      <span className="flex-1">{item.label}</span>
                      {badge ? <span className="rounded-full bg-warning-500 px-2 py-0.5 text-caption font-bold text-white">{badge}</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="border-t border-white/10 p-4 text-caption text-brand-200">
      <p className="truncate font-semibold text-white">{email}</p>
      <p className="capitalize">{role}</p>
      <Link href="/kg" className="mt-2 inline-block text-brand-100 underline-offset-2 hover:underline">← Back to site</Link>
    </div>
  );

  return (
    <>
      <div className="sticky top-0 z-40 flex items-center justify-between bg-brand-900 px-4 py-3 text-white lg:hidden">
        <span className="text-body font-bold">EduMaps<span className="text-leaf-300">.kg</span> <span className="text-small font-normal text-brand-200">Admin</span></span>
        <button type="button" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((v) => !v)} className="rounded-control p-2 hover:bg-white/10">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open ? <div className="fixed inset-x-0 bottom-0 top-[52px] z-30 flex flex-col bg-brand-900 lg:hidden">{nav}{footer}</div> : null}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col bg-brand-900 lg:flex">
        <div className="px-6 py-5 text-h3 font-bold text-white">EduMaps<span className="text-leaf-300">.kg</span> <span className="ml-1 text-small font-normal text-brand-200">Admin</span></div>
        {nav}
        {footer}
      </aside>
    </>
  );
}

