"use client";

import { List, Map as MapIcon, MapPinOff, Search, SlidersHorizontal } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { fmt } from "@/lib/i18n/fmt";
import { formatTuition } from "@/lib/i18n/format";
import { localizedPath } from "@/lib/i18n/config";
import { tr } from "@/lib/i18n/localized";
import type { MapSchool } from "@/lib/data/types";
import { cn } from "@/lib/utils";
import { useDict, useLang } from "@/components/i18n-provider";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input, Select } from "@/components/ui/form";
import { RatingBadge } from "@/components/ui/rating";
import type { MapPoint } from "./map-canvas";

const MapCanvas = dynamic(() => import("./map-canvas").then((m) => m.MapCanvas), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-ink-100" aria-hidden="true" />,
});

type CityOption = { slug: string; name: string };


type Filters = {
  q: string; city: string; system: string; language: string; grade: string; maxTuition: string;
  transport: boolean; boarding: boolean; sports: boolean;
};
const EMPTY: Filters = { q: "", city: "", system: "", language: "", grade: "", maxTuition: "", transport: false, boarding: false, sports: false };

export function MapExplorer({ schools, cities, token, unmapped = 0 }: { schools: MapSchool[]; cities: CityOption[]; token: string; unmapped?: number }) {
  const dict = useDict();
  const lang = useLang();
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<"map" | "list">(token ? "map" : "list");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const cityName = useMemo(() => new Map(cities.map((c) => [c.slug, c.name])), [cities]);
  const tuitionLabels = { currency: dict.common.currency, perMonth: dict.common.perMonth, free: dict.common.free, onRequest: dict.common.onRequest };

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    const grade = filters.grade === "" ? null : Number(filters.grade);
    const maxTuition = filters.maxTuition === "" ? null : Number(filters.maxTuition);
    return schools
      .filter((s) => {
        if (q && !`${s.name?.kg ?? ""} ${s.name?.ru ?? ""} ${s.name?.en ?? ""}`.toLowerCase().includes(q)) return false;
        if (filters.city && s.city_slug !== filters.city) return false;
        if (filters.system && !s.education_systems.includes(filters.system)) return false;
        if (filters.language && !s.languages.includes(filters.language)) return false;
        if (grade !== null && !(s.grade_from <= grade && s.grade_to >= grade)) return false;
        if (maxTuition !== null && (s.tuition_min ?? 0) > maxTuition) return false;
        if (filters.transport && !s.has_transportation) return false;
        if (filters.boarding && !s.has_boarding) return false;
        if (filters.sports && !s.has_sports) return false;
        return true;
      })
      .sort((a, b) => b.rating_avg - a.rating_avg || b.rating_count - a.rating_count);
  }, [schools, filters]);

  const points: MapPoint[] = useMemo(
    () =>
      filtered.map((s) => ({
        id: s.id,
        lat: s.lat,
        lng: s.lng,
        name: tr(s.name, lang),
        city: cityName.get(s.city_slug) ?? "",
        href: localizedPath(lang, `/schools/${s.slug}`),
        rating: s.rating_avg,
        ratingCount: s.rating_count,
        tuition: formatTuition(s.tuition_min, s.tuition_max, lang, tuitionLabels),
        logo: s.logo_url,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtered, lang, cityName]
  );

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => setFilters((f) => ({ ...f, [key]: value }));
  const activeCount = Object.entries(filters).filter(([, v]) => v !== "" && v !== false).length;

  const filterControls = (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-ink-400" />
        <Input aria-label={dict.map.searchPlaceholder} placeholder={dict.map.searchPlaceholder} value={filters.q} onChange={(e) => set("q", e.target.value)} className="pl-10" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select aria-label={dict.schools.city} value={filters.city} onChange={(e) => set("city", e.target.value)}>
          <option value="">{dict.schools.allCities}</option>
          {cities.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </Select>
        <Select aria-label={dict.schools.grade} value={filters.grade} onChange={(e) => set("grade", e.target.value)}>
          <option value="">{dict.schools.anyGrade}</option>
          {Array.from({ length: 12 }, (_, i) => <option key={i} value={i}>{i === 0 ? dict.common.preschoolGrade : fmt(dict.common.gradeLabel, { n: i })}</option>)}
        </Select>
        <Select aria-label={dict.schools.system} value={filters.system} onChange={(e) => set("system", e.target.value)}>
          <option value="">{dict.schools.system}</option>
          {dict.catalog.systems.map((s) => <option key={s} value={s}>{dict.schools.systems[s]}</option>)}
        </Select>
        <Select aria-label={dict.schools.language} value={filters.language} onChange={(e) => set("language", e.target.value)}>
          <option value="">{dict.schools.language}</option>
          {dict.catalog.languages.map((l) => <option key={l} value={l}>{dict.schools.languageNames[l]}</option>)}
        </Select>
      </div>
      <Input aria-label={`${dict.schools.tuition} — ${dict.schools.tuitionTo}`} type="number" min={0} step={500} placeholder={`${dict.schools.tuition} — ${dict.schools.tuitionTo}`} value={filters.maxTuition} onChange={(e) => set("maxTuition", e.target.value)} />
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {([["transport", dict.schools.transport], ["boarding", dict.schools.boarding], ["sports", dict.schools.sports]] as const).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-small text-ink-700">
            <input type="checkbox" checked={filters[key]} onChange={(e) => set(key, e.target.checked)} className="size-4.5 rounded border-ink-300 text-brand-700" />
            {label}
          </label>
        ))}
      </div>
      {activeCount > 0 ? <Button variant="ghost" size="sm" onClick={() => setFilters(EMPTY)}>{dict.schools.clearFilters}</Button> : null}
    </div>
  );

  const list = (
    <ul className="divide-y divide-ink-200">
      {filtered.length === 0 ? <li className="p-6 text-center text-small text-ink-600">{dict.map.noneMatch}</li> : null}
      {filtered.map((s) => (
        <li key={s.id}>
          <button
            type="button"
            onClick={() => { setSelected(s.id); setView("map"); }}
            className={cn("flex w-full flex-col gap-1 px-4 py-3.5 text-left transition-colors hover:bg-ink-50", selected === s.id && "bg-brand-50")}
          >
            <span className="text-small font-semibold text-ink-900">{tr(s.name, lang)}</span>
            <span className="text-caption text-ink-600">{cityName.get(s.city_slug)} · {formatTuition(s.tuition_min, s.tuition_max, lang, tuitionLabels)}</span>
            <RatingBadge value={s.rating_avg} count={s.rating_count} emptyLabel={dict.common.notRatedYet} />
          </button>
        </li>
      ))}
    </ul>
  );

  const unmappedNote = unmapped > 0 ? (
    <p className="border-t border-ink-200 px-4 py-3 text-caption text-ink-600">{fmt(dict.map.noLocation, { count: unmapped })}</p>
  ) : null;

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col lg:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden w-96 shrink-0 flex-col border-r border-ink-200 bg-white lg:flex">
        <div className="border-b border-ink-200 p-4">
          <h1 className="mb-4 text-h3 font-semibold">{dict.map.title}</h1>
          {filterControls}
        </div>
        <p className="border-b border-ink-200 px-4 py-2.5 text-caption font-semibold text-ink-600" aria-live="polite">
          {fmt(dict.map.showing, { count: filtered.length })}
        </p>
        <div className="flex-1 overflow-y-auto">{list}{unmappedNote}</div>
      </aside>

      {/* Mobile toolbar */}
      <div className="flex items-center gap-2 border-b border-ink-200 bg-white p-3 lg:hidden">
        <Button variant="outline" size="sm" onClick={() => setFiltersOpen(true)} className="flex-1">
          <SlidersHorizontal /> {dict.map.filters}{activeCount > 0 ? ` (${activeCount})` : ""}
        </Button>
        <div className="inline-flex rounded-control bg-ink-100 p-1" role="group">
          {([["map", MapIcon, dict.map.mapView], ["list", List, dict.map.listView]] as const).map(([key, Icon, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={view === key}
              onClick={() => setView(key)}
              className={cn("inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-small font-semibold", view === key ? "bg-white text-brand-800 shadow-sm" : "text-ink-600")}
            >
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </div>
      </div>
      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent title={dict.map.filters} closeLabel={dict.common.close}>
          {filterControls}
          <Button className="mt-6 w-full" onClick={() => setFiltersOpen(false)}>{fmt(dict.map.showing, { count: filtered.length })}</Button>
        </DialogContent>
      </Dialog>

      {/* Map / list */}
      <div className="relative min-h-0 flex-1">
        <div className={cn("absolute inset-0", view === "list" && "hidden lg:block")}>
          {token ? (
            <MapCanvas
              token={token}
              points={points}
              selectedId={selected}
              onSelect={setSelected}
              labels={{ viewProfile: dict.map.viewProfile, notRated: dict.common.notRatedYet, loadError: dict.map.loadError, resetView: dict.map.resetView }}
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-4 bg-ink-100 p-8 text-center">
              <MapPinOff className="size-10 text-ink-400" />
              <Alert tone="info" title={dict.map.tokenMissing} className="max-w-md text-left">{dict.map.tokenHint}</Alert>
              <Button variant="outline" className="lg:hidden" onClick={() => setView("list")}><List /> {dict.map.listView}</Button>
            </div>
          )}
        </div>
        <div className={cn("absolute inset-0 overflow-y-auto bg-white lg:hidden", view === "map" && "hidden")}>{list}{unmappedNote}</div>
      </div>
    </div>
  );
}
