import { BookOpen, Clock, PlayCircle } from "lucide-react";
import Link from "next/link";
import { localizedPath, type Lang } from "@/lib/i18n/config";
import { fmt } from "@/lib/i18n/fmt";
import { formatDate } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { tr } from "@/lib/i18n/localized";
import type { ArticleCardData } from "@/lib/data/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { MediaImage } from "@/components/ui/media-image";
import { FavoriteButton } from "@/components/schools/favorite-button";

export function ArticleCard({ article, lang, dict, priority = false, className }: {
  article: ArticleCardData; lang: Lang; dict: Dictionary; priority?: boolean; className?: string;
}) {
  const kinds = dict.education.kinds as Record<string, string>;
  const href = localizedPath(lang, `/education/${article.article_categories.slug}/${article.slug}`);
  return (
    <article className={cn("group relative flex h-full flex-col overflow-hidden rounded-card border border-ink-200 bg-white shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lift", className)}>
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-leaf-100 to-brand-100">
        {article.cover_url ? (
          <MediaImage
            src={article.cover_url}
            alt=""
            fill
            priority={priority}
            sizes="(min-width: 1024px) 384px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : null}
        {article.kind === "video" ? (
          <span className="absolute inset-0 flex items-center justify-center bg-ink-900/20">
            <PlayCircle className="size-14 text-white drop-shadow" strokeWidth={1.5} />
          </span>
        ) : null}
        <div className="absolute right-3 top-3"><FavoriteButton kind="article" id={article.id} /></div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge tone="leaf">{tr(article.article_categories.name, lang)}</Badge>
          {article.kind !== "article" ? (
            <Badge tone="brand"><BookOpen className="size-3" />{kinds[article.kind]}</Badge>
          ) : null}
        </div>
        <h3 className="text-h3 font-semibold leading-snug">
          <Link href={href} className="after:absolute after:inset-0 after:content-[''] hover:text-brand-700">{tr(article.title, lang)}</Link>
        </h3>
        <p className="mt-2 line-clamp-3 text-small text-ink-600">{tr(article.excerpt, lang)}</p>
        <div className="mt-auto flex items-center gap-3 pt-4 text-caption text-ink-500">
          <span className="inline-flex items-center gap-1"><Clock className="size-3.5" />{fmt(dict.common.minRead, { n: article.reading_minutes })}</span>
          {article.published_at ? <span>{formatDate(article.published_at, lang, "short")}</span> : null}
        </div>
      </div>
    </article>
  );
}
