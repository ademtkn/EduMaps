import { SearchX } from "lucide-react";
import { localizedPath, type Lang } from "@/lib/i18n/config";
import { fmt } from "@/lib/i18n/fmt";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { CityData } from "@/lib/data/geo";
import { listSchools, PAGE_SIZE, type SchoolFilters } from "@/lib/data/schools";
import { activeFilterCount, type SearchParams } from "@/lib/schools-params";
import { AdSlot } from "@/components/ads/ad-slot";
import { ViewTracker } from "@/components/seo/view-tracker";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LLink } from "@/components/ui/localized-link";
import { Pagination } from "@/components/ui/pagination";
import { SchoolCard } from "./school-card";
import { SchoolFilters as FilterPanel } from "./school-filters";
import { SortSelect } from "./sort-select";

/** Filter sidebar + sorted, paginated result grid. Shared by /schools, city, province and education-system pages. */
export async function SchoolsBrowser({ lang, dict, basePath, searchParams, filters, locked = {}, cities, hideCity = false }: {
  lang: Lang;
  dict: Dictionary;
  basePath: string;
  searchParams: SearchParams;
  filters: SchoolFilters;
  locked?: Partial<SchoolFilters>;
  cities: CityData[];
  hideCity?: boolean;
}) {
  const { items, total } = await listSchools(filters);
  const page = filters.page ?? 1;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const hrefFor = (target: number) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (key === "page" || value === undefined) continue;
      for (const v of Array.isArray(value) ? value : [value]) next.append(key, v);
    }
    if (target > 1) next.set("page", String(target));
    const query = next.toString();
    return `${localizedPath(lang, basePath)}${query ? `?${query}` : ""}`;
  };

  return (
    <div className="container-page grid grid-cols-[minmax(0,1fr)] gap-8 py-8 lg:grid-cols-[300px_minmax(0,1fr)]">
      {filters.q ? <ViewTracker type="search" dedupe={filters.q} /> : null}
      <FilterPanel cities={cities} hideCity={hideCity} showDistricts={filters.city === "bishkek"} activeCount={activeFilterCount(filters, locked)} />

      <div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-small font-medium text-ink-700" aria-live="polite">
            {total === 1 ? dict.schools.foundOne : fmt(dict.schools.found, { count: total })}
          </p>
          <SortSelect current={filters.sort ?? "rating"} />
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon={<SearchX className="size-6" />}
            title={dict.schools.noResultsTitle}
            description={dict.schools.noResultsDescription}
            action={<Button asChild variant="outline"><LLink href={basePath}>{dict.schools.clearFilters}</LLink></Button>}
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((school, i) => (
              <SchoolCard key={school.id} school={school} lang={lang} dict={dict} priority={i < 3} rank={filters.sort === undefined || filters.sort === "rating" ? (page - 1) * PAGE_SIZE + i + 1 : undefined} />
            ))}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} hrefFor={hrefFor} prevLabel={dict.common.prevPage} nextLabel={dict.common.nextPage} />

        <div className="mt-10">
          <AdSlot placement="banner" lang={lang} dict={dict} />
        </div>
      </div>
    </div>
  );
}
