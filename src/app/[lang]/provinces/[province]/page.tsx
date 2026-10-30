import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SchoolsBrowser } from "@/components/schools/schools-browser";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PageHeader } from "@/components/ui/section";
import { JsonLd } from "@/components/seo/json-ld";
import { getProvince, listCities, listProvinces, schoolCountsByCity } from "@/lib/data/geo";
import { LANGS, isLang, localizedPath } from "@/lib/i18n/config";
import { fmt } from "@/lib/i18n/fmt";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { tr } from "@/lib/i18n/localized";
import { parseSchoolSearch, type SearchParams } from "@/lib/schools-params";
import { breadcrumbLd } from "@/lib/seo/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";

type Props = { params: Promise<{ lang: string; province: string }>; searchParams: Promise<SearchParams> };

export async function generateStaticParams() {
  try {
    const provinces = await listProvinces();
    return LANGS.flatMap((lang) => provinces.map((p) => ({ lang, province: p.slug })));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { lang, province: slug } = await params;
  if (!isLang(lang)) return {};
  const [dict, province, sp] = await Promise.all([getDictionary(lang), getProvince(slug), searchParams]);
  if (!province) return {};
  const name = tr(province.name, lang);
  return buildMetadata({
    lang,
    path: `/provinces/${slug}`,
    title: fmt(dict.schools.provincePageTitle, { province: name }),
    description: tr(province.description, lang) || fmt(dict.schools.provincePageDescription, { province: name }),
    noindex: Object.keys(sp).length > 0,
  });
}

export default async function ProvincePage({ params, searchParams }: Props) {
  const { lang, province: slug } = await params;
  if (!isLang(lang)) notFound();
  const [dict, province, cities, counts, sp] = await Promise.all([
    getDictionary(lang), getProvince(slug), listCities(), schoolCountsByCity(), searchParams,
  ]);
  if (!province) notFound();

  const name = tr(province.name, lang);
  const provinceCities = cities.filter((c) => c.provinces.slug === slug);
  const locked = { province: slug };
  return (
    <>
      <PageHeader title={fmt(dict.schools.provincePageTitle, { province: name })} description={tr(province.description, lang)}>
        <Breadcrumbs items={[{ label: dict.nav.schools, href: "/schools" }, { label: name }]} />
        {provinceCities.length > 0 ? (
          <div className="mt-6">
            <h2 className="mb-3 text-small font-semibold text-ink-700">{fmt(dict.schools.citiesInProvince, { province: name })}</h2>
            <div className="flex flex-wrap gap-2">
              {provinceCities.map((city) => (
                <Link
                  key={city.slug}
                  href={localizedPath(lang, `/cities/${city.slug}`)}
                  className="rounded-full border border-ink-200 bg-white px-4 py-2 text-small font-semibold text-ink-800 transition-colors hover:border-brand-300 hover:text-brand-700"
                >
                  {tr(city.name, lang)} · {counts[city.slug] ?? 0}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </PageHeader>
      <SchoolsBrowser
        lang={lang}
        dict={dict}
        basePath={`/provinces/${slug}`}
        searchParams={sp}
        filters={parseSchoolSearch(sp, lang, locked)}
        locked={locked}
        cities={cities}
      />
      <JsonLd data={breadcrumbLd([{ name: dict.nav.schools, path: "/schools" }, { name, path: `/provinces/${slug}` }], lang)} />
    </>
  );
}
