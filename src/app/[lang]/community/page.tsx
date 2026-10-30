import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CommunityListing } from "@/components/community/community-listing";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PageHeader } from "@/components/ui/section";
import { listCommunityCategories, postCountsByCategory } from "@/lib/data/community";
import { isLang } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { breadcrumbLd } from "@/lib/seo/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";
import { firstParam, toInt } from "@/lib/utils";

export const revalidate = 60;

type Props = { params: Promise<{ lang: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const dict = await getDictionary(lang);
  return buildMetadata({ lang, path: "/community", title: dict.community.title, description: dict.community.description });
}

export default async function CommunityPage({ params, searchParams }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const sp = await searchParams;
  const [dict, categories, counts] = await Promise.all([getDictionary(lang), listCommunityCategories(), postCountsByCategory()]);
  return (
    <>
      <PageHeader title={dict.community.title} description={dict.community.description}>
        <Breadcrumbs items={[{ label: dict.nav.community }]} />
      </PageHeader>
      <CommunityListing lang={lang} dict={dict} categories={categories} counts={counts} page={Math.max(1, toInt(firstParam(sp.page)) ?? 1)} />
      <JsonLd data={breadcrumbLd([{ name: dict.nav.community, path: "/community" }], lang)} />
    </>
  );
}
