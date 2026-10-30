import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Server-rendered pagination. `hrefFor` builds the URL for a page number. */
export function Pagination({
  page, totalPages, hrefFor, prevLabel, nextLabel,
}: { page: number; totalPages: number; hrefFor: (page: number) => string; prevLabel: string; nextLabel: string }) {
  if (totalPages <= 1) return null;
  const pages = new Set<number>([1, totalPages, page - 1, page, page + 1]);
  const list = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  const item = "inline-flex h-10 min-w-10 items-center justify-center rounded-control px-3 text-small font-semibold";
  return (
    <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={cn(item, "text-ink-700 hover:bg-ink-100")} aria-label={prevLabel} rel="prev">
          <ChevronLeft className="size-4" />
        </Link>
      ) : null}
      {list.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && p - list[i - 1]! > 1 ? <span className="px-1 text-ink-400">…</span> : null}
          <Link
            href={hrefFor(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(item, p === page ? "bg-brand-700 text-white" : "text-ink-700 hover:bg-ink-100")}
          >
            {p}
          </Link>
        </span>
      ))}
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className={cn(item, "text-ink-700 hover:bg-ink-100")} aria-label={nextLabel} rel="next">
          <ChevronRight className="size-4" />
        </Link>
      ) : null}
    </nav>
  );
}
