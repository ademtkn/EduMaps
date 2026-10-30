import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EducationListing } from "@/components/education/education-listing";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PageHeader } from "@/components/ui/section";
import { listArticleCategories } from "@/lib/data/articles";
import { LANGS, isLang } from "@/lib/i18n/config";
import { fmt } from "@/lib/i18n/fmt";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { tr } from "@/lib/i18n/localized";
import { breadcrumbLd } from "@/lib/seo/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";
import { firstParam, toInt } from "@/lib/utils";

type Props = { params: Promise<{ lang: string; category: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateStaticParams() {
  try {
    const categories = await listArticleCategories();
    return LANGS.flatMap((lang) => categories.map((c) => ({ lang, category: c.slug })));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { lang, category: slug } = await params;
  if (!isLang(lang)) return {};
  const [dict, categories, sp] = await Promise.all([getDictionary(lang), listArticleCategories(), searchParams]);
  const category = categories.find((c) => c.slug === slug);
  if (!category) return {};
  return buildMetadata({
    lang,
    path: `/education/${slug}`,
    title: fmt(dict.education.categoryTitle, { category: tr(category.name, lang) }),
    description: tr(category.description, lang) || dict.education.description,
    noindex: Object.keys(sp).length > 0,
  });
}

export default async function EducationCategoryPage({ params, searchParams }: Props) {
  const { lang, category: slug } = await params;
  if (!isLang(lang)) notFound();
  const [dict, categories, sp] = await Promise.all([getDictionary(lang), listArticleCategories(), searchParams]);
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();
  const name = tr(category.name, lang);
  const kind = firstParam(sp.type);
  return (
    <>
      <PageHeader title={name} description={tr(category.description, lang)}>
        <Breadcrumbs items={[{ label: dict.nav.education, href: "/education" }, { label: name }]} />
      </PageHeader>
      <EducationListing
        lang={lang} dict={dict} categories={categories} category={slug}
        kind={kind && ["article", "video", "guide"].includes(kind) ? kind : undefined}
        page={Math.max(1, toInt(firstParam(sp.page)) ?? 1)}
      />
      <JsonLd data={breadcrumbLd([{ name: dict.nav.education, path: "/education" }, { name, path: `/education/${slug}` }], lang)} />
    </>
  );
}
