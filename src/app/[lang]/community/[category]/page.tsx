import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CommunityListing } from "@/components/community/community-listing";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PageHeader } from "@/components/ui/section";
import { listCommunityCategories, postCountsByCategory } from "@/lib/data/community";
import { LANGS, isLang } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { tr } from "@/lib/i18n/localized";
import { breadcrumbLd } from "@/lib/seo/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";
import { firstParam, toInt } from "@/lib/utils";

export const revalidate = 60;

type Props = { params: Promise<{ lang: string; category: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateStaticParams() {
  try {
    const categories = await listCommunityCategories();
    return LANGS.flatMap((lang) => categories.map((c) => ({ lang, category: c.slug })));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, category: slug } = await params;
  if (!isLang(lang)) return {};
  const category = (await listCommunityCategories()).find((c) => c.slug === slug);
  if (!category) return {};
  return buildMetadata({ lang, path: `/community/${slug}`, title: `${tr(category.name, lang)} — ${(await getDictionary(lang)).community.title}`, description: tr(category.description, lang) });
}

export default async function CommunityCategoryPage({ params, searchParams }: Props) {
  const { lang, category: slug } = await params;
  if (!isLang(lang)) notFound();
  const sp = await searchParams;
  const [dict, categories, counts] = await Promise.all([getDictionary(lang), listCommunityCategories(), postCountsByCategory()]);
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();
  const name = tr(category.name, lang);
  return (
    <>
      <PageHeader title={name} description={tr(category.description, lang)}>
        <Breadcrumbs items={[{ label: dict.nav.community, href: "/community" }, { label: name }]} />
      </PageHeader>
      <CommunityListing lang={lang} dict={dict} categories={categories} counts={counts} category={slug} page={Math.max(1, toInt(firstParam(sp.page)) ?? 1)} />
      <JsonLd data={breadcrumbLd([{ name: dict.nav.community, path: "/community" }, { name, path: `/community/${slug}` }], lang)} />
    </>
  );
}
