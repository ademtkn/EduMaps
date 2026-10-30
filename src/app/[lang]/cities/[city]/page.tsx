import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SchoolsBrowser } from "@/components/schools/schools-browser";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PageHeader } from "@/components/ui/section";
import { JsonLd } from "@/components/seo/json-ld";
import { getCity, listCities } from "@/lib/data/geo";
import { LANGS, isLang } from "@/lib/i18n/config";
import { fmt } from "@/lib/i18n/fmt";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { tr } from "@/lib/i18n/localized";
import { parseSchoolSearch, type SearchParams } from "@/lib/schools-params";
import { breadcrumbLd } from "@/lib/seo/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";

type Props = { params: Promise<{ lang: string; city: string }>; searchParams: Promise<SearchParams> };

export async function generateStaticParams() {
  try {
    const cities = await listCities();
    return LANGS.flatMap((lang) => cities.map((c) => ({ lang, city: c.slug })));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { lang, city: slug } = await params;
  if (!isLang(lang)) return {};
  const [dict, city, sp] = await Promise.all([getDictionary(lang), getCity(slug), searchParams]);
  if (!city) return {};
  const name = tr(city.name, lang);
  return buildMetadata({
    lang,
    path: `/cities/${slug}`,
    title: fmt(dict.schools.cityPageTitle, { city: name }),
    description: fmt(dict.schools.cityPageDescription, { city: name }),
    noindex: Object.keys(sp).length > 0,
  });
}

export default async function CityPage({ params, searchParams }: Props) {
  const { lang, city: slug } = await params;
  if (!isLang(lang)) notFound();
  const [dict, city, cities, sp] = await Promise.all([getDictionary(lang), getCity(slug), listCities(), searchParams]);
  if (!city) notFound();

  const name = tr(city.name, lang);
  const provinceName = tr(city.provinces.name, lang);
  const locked = { city: slug };
  return (
    <>
      <PageHeader title={fmt(dict.schools.cityPageTitle, { city: name })} description={tr(city.description, lang) || fmt(dict.schools.cityPageDescription, { city: name })}>
        <Breadcrumbs
          items={[
            { label: dict.nav.schools, href: "/schools" },
            { label: provinceName, href: `/provinces/${city.provinces.slug}` },
            { label: name },
          ]}
        />
      </PageHeader>
      <SchoolsBrowser
        lang={lang}
        dict={dict}
        basePath={`/cities/${slug}`}
        searchParams={sp}
        filters={parseSchoolSearch(sp, lang, locked)}
        locked={locked}
        cities={cities}
        hideCity
      />
      <JsonLd
        data={breadcrumbLd(
          [
            { name: dict.nav.schools, path: "/schools" },
            { name: provinceName, path: `/provinces/${city.provinces.slug}` },
            { name, path: `/cities/${slug}` },
          ],
          lang
        )}
      />
    </>
  );
}
