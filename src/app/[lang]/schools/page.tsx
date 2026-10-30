import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SchoolsBrowser } from "@/components/schools/schools-browser";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PageHeader } from "@/components/ui/section";
import { JsonLd } from "@/components/seo/json-ld";
import { listCities } from "@/lib/data/geo";
import { listSchools } from "@/lib/data/schools";
import { isLang } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { tr } from "@/lib/i18n/localized";
import { parseSchoolSearch, type SearchParams } from "@/lib/schools-params";
import { breadcrumbLd, itemListLd } from "@/lib/seo/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";

type Props = { params: Promise<{ lang: string }>; searchParams: Promise<SearchParams> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const dict = await getDictionary(lang);
  const sp = await searchParams;
  // Filtered and paginated views are not separate landing pages: keep them out of the index.
  const filtered = Object.keys(sp).length > 0;
  return buildMetadata({ lang, path: "/schools", title: dict.schools.title, description: dict.schools.description, noindex: filtered });
}

export default async function SchoolsPage({ params, searchParams }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const sp = await searchParams;
  const [dict, cities] = await Promise.all([getDictionary(lang), listCities()]);
  const filters = parseSchoolSearch(sp, lang);
  const top = Object.keys(sp).length === 0 ? (await listSchools({ ...filters, pageSize: 12 })).items : [];

  return (
    <>
      <PageHeader title={dict.schools.title} description={dict.schools.description}>
        <Breadcrumbs items={[{ label: dict.nav.schools }]} />
      </PageHeader>
      <SchoolsBrowser lang={lang} dict={dict} basePath="/schools" searchParams={sp} filters={filters} cities={cities} />
      <JsonLd
        data={[
          breadcrumbLd([{ name: dict.nav.schools, path: "/schools" }], lang),
          ...(top.length ? [itemListLd(top.map((s) => ({ name: tr(s.name, lang), path: `/schools/${s.slug}` })), lang)] : []),
        ]}
      />
    </>
  );
}
