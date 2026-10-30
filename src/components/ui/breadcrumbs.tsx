import { ChevronRight } from "lucide-react";
import { LLink } from "./localized-link";

export function Breadcrumbs({ items, tone = "dark" }: { items: { label: string; href?: string }[]; tone?: "dark" | "light" }) {
  const light = tone === "light";
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className={`flex flex-wrap items-center gap-1 text-caption ${light ? "text-brand-200" : "text-ink-500"}`}>
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-1">
            {i > 0 ? <ChevronRight className="size-3.5" /> : null}
            {item.href ? (
              <LLink href={item.href} className={light ? "hover:text-white hover:underline" : "hover:text-brand-700 hover:underline"}>{item.label}</LLink>
            ) : (
              <span aria-current="page" className={`font-medium ${light ? "text-white" : "text-ink-700"}`}>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
