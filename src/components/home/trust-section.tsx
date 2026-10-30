import { BadgeCheck, Check, ShieldCheck, X } from "lucide-react";
import type { ReactNode } from "react";
import { LLink } from "@/components/ui/localized-link";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

function Column({ title, tone, icon, items }: { title: string; tone: "leaf" | "danger" | "brand"; icon: ReactNode; items: string[] }) {
  const accent = { leaf: "bg-leaf-50 text-leaf-700", danger: "bg-danger-50 text-danger-700", brand: "bg-brand-50 text-brand-700" }[tone];
  const bullet = { leaf: "text-leaf-600", danger: "text-danger-600", brand: "text-brand-600" }[tone];
  return (
    <article className="flex flex-col rounded-card border border-ink-200 bg-white p-6 shadow-card">
      <h3 className="flex items-center gap-3 text-h3 font-semibold">
        <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${accent}`} aria-hidden="true">{icon}</span>
        {title}
      </h3>
      <ul className="mt-5 space-y-3 text-small text-ink-700">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5">
            <span className={`mt-0.5 shrink-0 ${bullet}`} aria-hidden="true">{tone === "danger" ? <X className="size-4" /> : tone === "leaf" ? <Check className="size-4" /> : <BadgeCheck className="size-4" />}</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

/** Home page explanation of how reviews and school information are chosen, checked and published. */
export function TrustSection({ dict }: { dict: Dictionary }) {
  const t = dict.home.trust;
  return (
    <section id="trust" aria-labelledby="trust-title" className="container-page pt-16">
      <div className="mb-8 max-w-3xl">
        <p className="text-small font-semibold uppercase tracking-wide text-leaf-700">{t.eyebrow}</p>
        <h2 id="trust-title" className="mt-1 text-h2 font-semibold">{t.title}</h2>
        <p className="mt-2 text-body text-ink-600">{t.description}</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Column title={t.reviewsTitle} tone="leaf" icon={<Check className="size-5" />} items={t.publishedItems} />
        <Column title={t.rejectedTitle} tone="danger" icon={<X className="size-5" />} items={t.rejectedItems} />
        <Column title={t.infoTitle} tone="brand" icon={<ShieldCheck className="size-5" />} items={t.infoItems} />
      </div>
      <div className="mt-5 flex flex-col gap-3 rounded-card border border-leaf-200 bg-leaf-50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-small font-semibold text-leaf-800">{t.ratingNote}</p>
          <p className="text-small text-ink-700">{t.report}</p>
        </div>
        <LLink href="/guidelines" className="shrink-0 text-small font-semibold text-brand-700 hover:underline">{t.more} →</LLink>
      </div>
    </section>
  );
}
