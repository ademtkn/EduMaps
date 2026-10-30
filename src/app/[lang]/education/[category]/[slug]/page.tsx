import { Clock } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/ads/ad-slot";
import { ArticleCard } from "@/components/education/article-card";
import { Markdown } from "@/components/education/markdown";
import { ShareButton } from "@/components/education/share-button";
import { FavoriteButton } from "@/components/schools/favorite-button";
import { VideoEmbed } from "@/components/schools/video-embed";
import { JsonLd } from "@/components/seo/json-ld";
import { ViewTracker } from "@/components/seo/view-tracker";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { MediaImage } from "@/components/ui/media-image";
import { getAllArticleSlugs, getArticle, listArticles } from "@/lib/data/articles";
import { LANGS, isLang } from "@/lib/i18n/config";
import { fmt } from "@/lib/i18n/fmt";
import { formatDate } from "@/lib/i18n/format";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { tr } from "@/lib/i18n/localized";
import { articleLd, breadcrumbLd } from "@/lib/seo/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";
import { youtubeEmbedUrl } from "@/lib/utils";

export const revalidate = 300;

type Props = { params: Promise<{ lang: string; category: string; slug: string }> };

export async function generateStaticParams() {
  try {
    const all = await getAllArticleSlugs();
    return LANGS.flatMap((lang) => all.map((a) => ({ lang, category: a.category, slug: a.slug })));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, category, slug } = await params;
  if (!isLang(lang)) return {};
  const article = await getArticle(slug);
  if (!article || article.article_categories.slug !== category) return {};
  return buildMetadata({
    lang,
    path: `/education/${category}/${slug}`,
    title: tr(article.title, lang),
    description: tr(article.excerpt, lang),
    image: article.cover_url,
    type: "article",
    publishedTime: article.published_at,
    modifiedTime: article.updated_at,
  });
}

export default async function ArticlePage({ params }: Props) {
  const { lang, category, slug } = await params;
  if (!isLang(lang)) notFound();
  const article = await getArticle(slug);
  if (!article || article.article_categories.slug !== category) notFound();

  const [dict, more] = await Promise.all([
    getDictionary(lang),
    listArticles({ category, pageSize: 3, excludeId: article.id }),
  ]);
  const title = tr(article.title, lang);
  const categoryName = tr(article.article_categories.name, lang);
  const embed = article.video_url ? youtubeEmbedUrl(article.video_url) : null;
  const path = `/education/${category}/${slug}`;
  const author = article.profiles?.display_name ?? dict.education.authorFallback;
  const kinds = dict.education.kinds as Record<string, string>;

  return (
    <>
      <ViewTracker type="article_view" id={article.id} />
      <article className="container-page grid grid-cols-[minmax(0,1fr)] gap-10 py-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <Breadcrumbs items={[{ label: dict.nav.education, href: "/education" }, { label: categoryName, href: `/education/${category}` }, { label: title }]} />
          <header>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge tone="leaf">{categoryName}</Badge>
              {article.kind !== "article" ? <Badge tone="brand">{kinds[article.kind]}</Badge> : null}
            </div>
            <h1 className="text-h1 font-bold sm:text-[2.5rem] sm:leading-[1.15]">{title}</h1>
            <p className="mt-4 text-body text-ink-600 sm:text-lg">{tr(article.excerpt, lang)}</p>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-small text-ink-600">
              <span>{dict.common.by} <strong className="text-ink-800">{author}</strong></span>
              {article.published_at ? <span>{fmt(dict.education.publishedOn, { date: formatDate(article.published_at, lang) })}</span> : null}
              <span className="inline-flex items-center gap-1"><Clock className="size-4" />{fmt(dict.common.minRead, { n: article.reading_minutes })}</span>
            </div>
            <div className="mt-5 flex gap-2">
              <FavoriteButton kind="article" id={article.id} variant="button" />
              <ShareButton title={title} />
            </div>
          </header>

          {embed ? (
            <div className="mt-8"><VideoEmbed embedUrl={embed} title={title} /></div>
          ) : article.cover_url ? (
            <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-card bg-ink-100">
              <MediaImage src={article.cover_url} alt="" fill priority sizes="(min-width: 1024px) 760px, 100vw" className="object-cover" />
            </div>
          ) : null}

          <div className="mt-8"><Markdown>{tr(article.body, lang)}</Markdown></div>

          {article.tags.length ? (
            <ul className="mt-10 flex flex-wrap items-center gap-2" aria-label={dict.education.tags}>
              {article.tags.map((tag) => <li key={tag}><Badge tone="neutral">#{tag}</Badge></li>)}
            </ul>
          ) : null}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <AdSlot placement="sidebar" lang={lang} dict={dict} />
        </aside>
      </article>

      {more.items.length ? (
        <section className="container-page pb-6">
          <h2 className="mb-6 text-h2 font-semibold">{dict.education.related}</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {more.items.map((a) => <ArticleCard key={a.id} article={a} lang={lang} dict={dict} />)}
          </div>
        </section>
      ) : null}

      <JsonLd
        data={[
          breadcrumbLd([{ name: dict.nav.education, path: "/education" }, { name: categoryName, path: `/education/${category}` }, { name: title, path }], lang),
          articleLd({ lang, path, title, description: tr(article.excerpt, lang), image: article.cover_url, author, published: article.published_at, modified: article.updated_at }),
        ]}
      />
    </>
  );
}
