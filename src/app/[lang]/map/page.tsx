import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapExplorer } from "@/components/map/map-explorer";
import { ViewTracker } from "@/components/seo/view-tracker";
import { listCities } from "@/lib/data/geo";
import { getMapSchools, getSiteStats } from "@/lib/data/schools";
import { isLang } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { tr } from "@/lib/i18n/localized";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const dict = await getDictionary(lang);
  return buildMetadata({ lang, path: "/map", title: dict.map.title, description: dict.map.description });
}

export default async function MapPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const [schools, cities, stats] = await Promise.all([getMapSchools(), listCities(), getSiteStats()]);
  return (
    <>
      <ViewTracker type="map_open" />
      <MapExplorer
        schools={schools}
        cities={cities.map((c) => ({ slug: c.slug, name: tr(c.name, lang) }))}
        token={process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ""}
        unmapped={Math.max(0, stats.schools - schools.length)}
      />
    </>
  );
}
