import type { Lang } from "@/lib/i18n/config";
import { SCHOOL_SORTS, type SchoolFilters, type SchoolSort } from "@/lib/data/schools";
import { BISHKEK_DISTRICTS } from "@/lib/constants";
import { parseNear } from "@/lib/geo";
import { firstParam, toInt } from "@/lib/utils";

export type SearchParams = Record<string, string | string[] | undefined>;

// Option keys are managed by admins; the database decides which exist, so only the key shape is checked here.
const SYSTEMS = { has: (v: string) => /^[a-z0-9_]{1,40}$/.test(v) };
const LANGS = { has: (v: string) => /^[a-z]{2,3}$/.test(v) };
const TYPES = new Set(["public", "private", "international", "specialized"]);

function many(value: string | string[] | undefined, allowed: { has: (v: string) => boolean }): string[] {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  return [...new Set(list.filter((v) => allowed.has(v)))];
}

/** Turns raw URL search params into validated filters. Unknown values are dropped, never passed to the database. */
export function parseSchoolSearch(sp: SearchParams, lang: Lang, locked: Partial<SchoolFilters> = {}): SchoolFilters {
  const sortRaw = firstParam(sp.sort);
  const near = parseNear(firstParam(sp.near));
  // "nearest" only makes sense with a position; with one and no other choice, nearest comes first
  const chosen = (SCHOOL_SORTS as readonly string[]).includes(sortRaw ?? "") ? (sortRaw as SchoolSort) : undefined;
  const sort: SchoolSort = chosen === "nearest" ? (near ? "nearest" : "rating") : (chosen ?? (near ? "nearest" : "rating"));
  const grade = toInt(firstParam(sp.grade));
  const tmin = toInt(firstParam(sp.tmin));
  const tmax = toInt(firstParam(sp.tmax));
  const type = firstParam(sp.type);
  const city = firstParam(sp.city);
  const effectiveCity = locked.city ?? (city && /^[a-z0-9-]+$/.test(city) ? city : undefined);
  const district = firstParam(sp.district);

  return {
    lang,
    q: firstParam(sp.q)?.slice(0, 80),
    city: effectiveCity,
    // Districts only exist for Bishkek; ignore a leftover value after the city changes.
    district: effectiveCity === "bishkek" && district && (BISHKEK_DISTRICTS as readonly string[]).includes(district) ? district : undefined,
    province: locked.province,
    near,
    systems: locked.systems ?? many(sp.system, SYSTEMS),
    languages: many(sp.lang, LANGS),
    grade: grade !== undefined && grade >= 0 && grade <= 11 ? grade : undefined,
    tuitionMin: tmin !== undefined && tmin >= 0 ? tmin : undefined,
    tuitionMax: tmax !== undefined && tmax >= 0 ? tmax : undefined,
    transport: firstParam(sp.transport) === "1",
    boarding: firstParam(sp.boarding) === "1",
    sports: firstParam(sp.sports) === "1",
    type: type && TYPES.has(type) ? type : undefined,
    sort,
    page: Math.max(1, Math.min(toInt(firstParam(sp.page)) ?? 1, 500)),
  };
}

/** Number of filters the visitor has applied (used for the mobile filter button badge). */
export function activeFilterCount(f: SchoolFilters, locked: Partial<SchoolFilters> = {}): number {
  return [
    f.q,
    f.city && !locked.city ? f.city : undefined,
    f.district,
    f.systems?.length && !locked.systems ? 1 : undefined,
    f.languages?.length,
    f.grade !== undefined ? 1 : undefined,
    f.tuitionMin !== undefined ? 1 : undefined,
    f.tuitionMax !== undefined ? 1 : undefined,
    f.transport ? 1 : undefined,
    f.boarding ? 1 : undefined,
    f.sports ? 1 : undefined,
    f.type,
  ].filter(Boolean).length;
}
