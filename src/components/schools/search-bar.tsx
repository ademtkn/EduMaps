import { Search } from "lucide-react";
import { localizedPath, type Lang } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { tr } from "@/lib/i18n/localized";
import type { CityData } from "@/lib/data/geo";
import { Button } from "@/components/ui/button";

/** Plain GET form: works without JavaScript and produces shareable URLs. */
export function SearchBar({ lang, dict, cities, defaultQuery = "", defaultCity = "" }: {
  lang: Lang; dict: Dictionary; cities: CityData[]; defaultQuery?: string; defaultCity?: string;
}) {
  return (
    <form action={localizedPath(lang, "/schools")} method="get" role="search" className="flex w-full flex-col gap-2 rounded-card bg-white p-2 shadow-lift sm:flex-row sm:items-center">
      <label className="relative flex-1">
        <span className="sr-only">{dict.schools.searchPlaceholder}</span>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-ink-400" />
        <input
          name="q"
          type="search"
          defaultValue={defaultQuery}
          maxLength={80}
          placeholder={dict.home.searchPlaceholder}
          className="h-12 w-full rounded-control border-0 bg-transparent pl-11 pr-3 text-body text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
      </label>
      <div className="hidden h-8 w-px bg-ink-200 sm:block" />
      <label className="sm:w-52">
        <span className="sr-only">{dict.schools.city}</span>
        <select
          name="city"
          defaultValue={defaultCity}
          className="h-12 w-full rounded-control border-0 bg-transparent px-3 text-body text-ink-800 focus:outline-none focus:ring-2 focus:ring-brand-200"
        >
          <option value="">{dict.home.allCities}</option>
          {cities.map((city) => (
            <option key={city.slug} value={city.slug}>{tr(city.name, lang)}</option>
          ))}
        </select>
      </label>
      <Button type="submit" size="lg" className="sm:w-auto">
        <Search /> {dict.common.search}
      </Button>
    </form>
  );
}
