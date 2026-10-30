import { MessageSquarePlus, MessagesSquare } from "lucide-react";
import Link from "next/link";
import { listPosts, POSTS_PER_PAGE } from "@/lib/data/community";
import type { CategoryData } from "@/lib/data/types";
import { localizedPath, type Lang } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { tr } from "@/lib/i18n/localized";
import { cn } from "@/lib/utils";
import { AdSlot } from "@/components/ads/ad-slot";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { PostCard } from "./post-card";

export async function CommunityListing({ lang, dict, categories, category, page, counts }: {
  lang: Lang; dict: Dictionary; categories: CategoryData[]; category?: string; page: number; counts: Record<string, number>;
}) {
  const { items, total } = await listPosts({ category, page });
  const base = category ? `/community/${category}` : "/community";
  const newHref = `${localizedPath(lang, "/community/new")}${category ? `?category=${category}` : ""}`;

  return (
    <div className="container-page grid grid-cols-[minmax(0,1fr)] gap-8 py-8 lg:grid-cols-[260px_minmax(0,1fr)_300px]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Button asChild className="mb-5 w-full"><Link href={newHref}><MessageSquarePlus />{dict.community.newPost}</Link></Button>
        <nav aria-label={dict.community.allCategories} className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible">
          {[{ slug: "", label: dict.community.allCategories, count: Object.values(counts).reduce((a, b) => a + b, 0) }, ...categories.map((c) => ({ slug: c.slug, label: tr(c.name, lang), count: counts[c.slug] ?? 0 }))].map((item) => (
            <Link
              key={item.slug || "all"}
              href={localizedPath(lang, item.slug ? `/community/${item.slug}` : "/community")}
              aria-current={(category ?? "") === item.slug ? "page" : undefined}
              className={cn(
                "flex items-center justify-between gap-3 whitespace-nowrap rounded-control px-3.5 py-2.5 text-small font-semibold transition-colors",
                (category ?? "") === item.slug ? "bg-brand-50 text-brand-800" : "text-ink-700 hover:bg-ink-100"
              )}
            >
              <span>{item.label}</span>
              <span className="rounded-full bg-white px-2 py-0.5 text-caption text-ink-500">{item.count}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <div className="min-w-0">
        {items.length === 0 ? (
          <EmptyState
            icon={<MessagesSquare className="size-6" />}
            title={dict.community.noPosts}
            description={dict.community.beFirst}
            action={<Button asChild><Link href={newHref}>{dict.community.newPost}</Link></Button>}
          />
        ) : (
          <div className="space-y-4">{items.map((post) => <PostCard key={post.id} post={post} lang={lang} dict={dict} />)}</div>
        )}
        <Pagination
          page={page}
          totalPages={Math.max(1, Math.ceil(total / POSTS_PER_PAGE))}
          hrefFor={(p) => `${localizedPath(lang, base)}${p > 1 ? `?page=${p}` : ""}`}
          prevLabel={dict.common.prevPage}
          nextLabel={dict.common.nextPage}
        />
      </div>

      <aside className="space-y-6">
        <Card>
          <CardBody className="p-5">
            <h2 className="text-h3 font-semibold">{dict.community.guidelinesTitle}</h2>
            <ul className="mt-3 space-y-2 text-small text-ink-700">
              {[dict.community.guideline1, dict.community.guideline2, dict.community.guideline3, dict.community.guideline4].map((g) => (
                <li key={g} className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-leaf-500" />{g}</li>
              ))}
            </ul>
          </CardBody>
        </Card>
        <AdSlot placement="sidebar" lang={lang} dict={dict} />
      </aside>
    </div>
  );
}
