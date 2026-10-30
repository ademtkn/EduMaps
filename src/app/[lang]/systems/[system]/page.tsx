import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SchoolsBrowser } from "@/components/schools/schools-browser";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PageHeader } from "@/components/ui/section";
import { JsonLd } from "@/components/seo/json-ld";
import { listCities } from "@/lib/data/geo";
import { getCatalog } from "@/lib/data/catalog";
import { LANGS, isLang } from "@/lib/i18n/config";
import { fmt } from "@/lib/i18n/fmt";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { parseSchoolSearch, type SearchParams } from "@/lib/schools-params";
import { breadcrumbLd } from "@/lib/seo/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";

type Props = { params: Promise<{ lang: string; system: string }>; searchParams: Promise<SearchParams> };

export async function generateStaticParams() {
  try {
    const systems = (await getCatalog()).systems.filter((s) => s.is_active);
    return LANGS.flatMap((lang) => systems.map((s) => ({ lang, system: s.key })));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { lang, system } = await params;
  if (!isLang(lang)) return {};
  const [dict, sp] = await Promise.all([getDictionary(lang), searchParams]);
  const label = dict.schools.systems[system];
  if (!label || !dict.catalog.systems.includes(system)) return {};
  return buildMetadata({
    lang,
    path: `/systems/${system}`,
    title: fmt(dict.schools.systemPageTitle, { system: label }),
    description: fmt(dict.schools.systemPageDescription, { system: label }),
    noindex: Object.keys(sp).length > 0,
  });
}

export default async function SystemPage({ params, searchParams }: Props) {
  const { lang, system } = await params;
  if (!isLang(lang)) notFound();
  const [dict, cities, sp] = await Promise.all([getDictionary(lang), listCities(), searchParams]);
  const label = dict.schools.systems[system];
  if (!label || !dict.catalog.systems.includes(system)) notFound();
  const locked = { systems: [system] };
  return (
    <>
      <PageHeader title={fmt(dict.schools.systemPageTitle, { system: label })} description={fmt(dict.schools.systemPageDescription, { system: label })}>
        <Breadcrumbs items={[{ label: dict.nav.schools, href: "/schools" }, { label }]} />
      </PageHeader>
      <SchoolsBrowser
        lang={lang}
        dict={dict}
        basePath={`/systems/${system}`}
        searchParams={sp}
        filters={parseSchoolSearch(sp, lang, locked)}
        locked={locked}
        cities={cities}
      />
      <JsonLd data={breadcrumbLd([{ name: dict.nav.schools, path: "/schools" }, { name: label, path: `/systems/${system}` }], lang)} />
    </>
  );
}
