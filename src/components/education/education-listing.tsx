import Link from "next/link";
import { ARTICLES_PER_PAGE, listArticles } from "@/lib/data/articles";
import type { CategoryData } from "@/lib/data/types";
import { localizedPath, type Lang } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { tr } from "@/lib/i18n/localized";
import { cn } from "@/lib/utils";
import { AdSlot } from "@/components/ads/ad-slot";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { BookOpen } from "lucide-react";
import { ArticleCard } from "./article-card";

const KINDS = ["article", "video", "guide"] as const;

export async function EducationListing({ lang, dict, categories, category, kind, page }: {
  lang: Lang; dict: Dictionary; categories: CategoryData[]; category?: string; kind?: string; page: number;
}) {
  const { items, total } = await listArticles({ category, kind, page, featuredFirst: page === 1 && !kind });
  const base = category ? `/education/${category}` : "/education";
  const href = (opts: { kind?: string; page?: number }) => {
    const q = new URLSearchParams();
    if (opts.kind) q.set("type", opts.kind);
    if (opts.page && opts.page > 1) q.set("page", String(opts.page));
    return `${localizedPath(lang, base)}${q.size ? `?${q}` : ""}`;
  };
  const chip = "rounded-full border px-4 py-2 text-small font-semibold transition-colors";
  const kinds = dict.education.kinds as Record<string, string>;

  return (
    <div className="container-page py-8">
      <nav aria-label={dict.education.allCategories} className="scrollbar-none -mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-2">
        <Link href={localizedPath(lang, "/education")} className={cn(chip, !category ? "border-brand-700 bg-brand-700 text-white" : "border-ink-200 bg-white text-ink-700 hover:border-brand-300")}>
          {dict.education.allCategories}
        </Link>
        {categories.map((c) => (
          <Link key={c.slug} href={localizedPath(lang, `/education/${c.slug}`)} aria-current={category === c.slug ? "page" : undefined} className={cn(chip, "whitespace-nowrap", category === c.slug ? "border-brand-700 bg-brand-700 text-white" : "border-ink-200 bg-white text-ink-700 hover:border-brand-300")}>
            {tr(c.name, lang)}
          </Link>
        ))}
      </nav>
      <div className="mb-8 flex flex-wrap items-center gap-2" role="group" aria-label={dict.education.filterType}>
        <span className="text-small text-ink-600">{dict.education.filterType}:</span>
        <Link href={href({})} className={cn("rounded-full px-3 py-1 text-small font-medium", !kind ? "bg-ink-800 text-white" : "bg-ink-100 text-ink-700 hover:bg-ink-200")}>{dict.common.all}</Link>
        {KINDS.map((k) => (
          <Link key={k} href={href({ kind: k })} className={cn("rounded-full px-3 py-1 text-small font-medium", kind === k ? "bg-ink-800 text-white" : "bg-ink-100 text-ink-700 hover:bg-ink-200")}>{kinds[k]}</Link>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState icon={<BookOpen className="size-6" />} title={dict.education.noArticles} />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((article, i) => (
            <div key={article.id} className="contents">
              <ArticleCard article={article} lang={lang} dict={dict} priority={i < 3} />
              {i === 1 ? <AdSlot placement="featured_article" lang={lang} dict={dict} /> : null}
            </div>
          ))}
        </div>
      )}
      <Pagination
        page={page}
        totalPages={Math.max(1, Math.ceil(total / ARTICLES_PER_PAGE))}
        hrefFor={(p) => href({ kind, page: p })}
        prevLabel={dict.common.prevPage}
        nextLabel={dict.common.nextPage}
      />
    </div>
  );
}
