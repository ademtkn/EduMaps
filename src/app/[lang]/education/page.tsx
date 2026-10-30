import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EducationListing } from "@/components/education/education-listing";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PageHeader } from "@/components/ui/section";
import { listArticleCategories } from "@/lib/data/articles";
import { isLang } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { breadcrumbLd } from "@/lib/seo/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";
import { firstParam, toInt } from "@/lib/utils";

type Props = { params: Promise<{ lang: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const [dict, sp] = await Promise.all([getDictionary(lang), searchParams]);
  return buildMetadata({ lang, path: "/education", title: dict.education.title, description: dict.education.description, noindex: Object.keys(sp).length > 0 });
}

export default async function EducationPage({ params, searchParams }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const sp = await searchParams;
  const [dict, categories] = await Promise.all([getDictionary(lang), listArticleCategories()]);
  const kind = firstParam(sp.type);
  return (
    <>
      <PageHeader title={dict.education.title} description={dict.education.description}>
        <Breadcrumbs items={[{ label: dict.nav.education }]} />
      </PageHeader>
      <EducationListing
        lang={lang} dict={dict} categories={categories}
        kind={kind && ["article", "video", "guide"].includes(kind) ? kind : undefined}
        page={Math.max(1, toInt(firstParam(sp.page)) ?? 1)}
      />
      <JsonLd data={breadcrumbLd([{ name: dict.nav.education, path: "/education" }], lang)} />
    </>
  );
}
