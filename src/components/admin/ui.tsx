import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function AdminPage({ title, description, actions, children }: { title: string; description?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-h2 font-bold">{title}</h1>
          {description ? <p className="mt-1 text-small text-ink-600">{description}</p> : null}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

export function StatCard({ label, value, hint, tone = "brand" }: { label: string; value: ReactNode; hint?: string; tone?: "brand" | "leaf" | "warning" | "danger" }) {
  const accent = { brand: "bg-brand-500", leaf: "bg-leaf-500", warning: "bg-warning-500", danger: "bg-danger-600" }[tone];
  return (
    <div className="relative overflow-hidden rounded-card border border-ink-200 bg-white p-5 shadow-card">
      <span className={cn("absolute inset-y-0 left-0 w-1", accent)} />
      <p className="text-small text-ink-600">{label}</p>
      <p className="mt-1 text-h1 font-bold text-ink-900">{value}</p>
      {hint ? <p className="mt-1 text-caption text-ink-500">{hint}</p> : null}
    </div>
  );
}

export function Panel({ title, actions, children, className }: { title?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-card border border-ink-200 bg-white shadow-card", className)}>
      {title ? (
        <header className="flex items-center justify-between gap-3 border-b border-ink-200 px-5 py-4">
          <h2 className="text-body font-semibold">{title}</h2>
          {actions}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export function Table({ head, children, empty }: { head: string[]; children: ReactNode; empty?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] border-collapse text-left text-small">
        <thead>
          <tr className="border-b border-ink-200 bg-ink-50 text-caption font-semibold uppercase tracking-wide text-ink-500">
            {head.map((h) => <th key={h} scope="col" className="px-4 py-3">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-200">{children}</tbody>
      </table>
      {empty ? <p className="px-4 py-10 text-center text-ink-500">{empty}</p> : null}
    </div>
  );
}

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "neutral" | "info"> = {
  published: "success", pending: "warning", rejected: "danger", hidden: "neutral", draft: "neutral", archived: "neutral",
  open: "warning", resolved: "success",
};
export function StatusPill({ status }: { status: string }) {
  return <Badge tone={STATUS_TONE[status] ?? "neutral"} className="capitalize">{status}</Badge>;
}

export function FilterTabs({ items, current, base, param = "status" }: { items: { value: string; label: string; count?: number }[]; current: string; base: string; param?: string }) {
  return (
    <nav className="mb-4 flex flex-wrap gap-1.5" aria-label="Filter">
      {items.map((item) => (
        <Link
          key={item.value}
          href={item.value ? `${base}?${param}=${item.value}` : base}
          aria-current={current === item.value ? "page" : undefined}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-small font-semibold transition-colors",
            current === item.value ? "border-brand-700 bg-brand-700 text-white" : "border-ink-200 bg-white text-ink-700 hover:border-brand-300"
          )}
        >
          {item.label}
          {item.count !== undefined ? <span className={cn("rounded-full px-1.5 text-caption", current === item.value ? "bg-white/20" : "bg-ink-100")}>{item.count}</span> : null}
        </Link>
      ))}
    </nav>
  );
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bishkek" }).format(new Date(value));
}
