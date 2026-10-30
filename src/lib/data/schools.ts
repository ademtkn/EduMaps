import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import { BISHKEK_DISTRICTS } from "@/lib/constants";
import type { Lang } from "@/lib/i18n/config";
import type { MapSchool, ReviewData, SchoolCardData, SchoolDetail } from "./types";

const CARD_SELECT =
  "id,slug,name,tagline,logo_url,cover_url,rating_avg,rating_count,school_type,education_systems,has_transportation,has_boarding,has_sports,tuition_min,tuition_max,fee_min,fee_max,fee_period,fee_billing_months,opening_time,closing_time,working_days,grade_from,grade_to,updated_at,data_status," +
  "cities!inner(slug,name,provinces!inner(slug,name)),school_languages(language_code,is_primary)";

export const PAGE_SIZE = 12;
export const SCHOOL_SORTS = ["rating", "reviews", "name", "updated"] as const;
export type SchoolSort = (typeof SCHOOL_SORTS)[number];

export type SchoolFilters = {
  q?: string;
  city?: string;
  province?: string;
  /** One of BISHKEK_DISTRICTS; only meaningful together with the Bishkek city filter. */
  district?: string;
  systems?: string[];
  languages?: string[];
  grade?: number;
  tuitionMin?: number;
  tuitionMax?: number;
  transport?: boolean;
  boarding?: boolean;
  sports?: boolean;
  type?: string;
  sort?: SchoolSort;
  page?: number;
  pageSize?: number;
  /** Used to order by the localized name. */
  lang: Lang;
};

function escapeLike(value: string) {
  return value.replace(/[%_\\(),]/g, " ").replace(/\s+/g, " ").trim();
}

export async function listSchools(filters: SchoolFilters): Promise<{ items: SchoolCardData[]; total: number }> {
  const db = createPublicClient();
  const pageSize = filters.pageSize ?? PAGE_SIZE;
  const page = Math.max(1, filters.page ?? 1);

  let allowedIds: string[] | null = null;
  if (filters.languages?.length) {
    const { data } = await db.from("school_languages").select("school_id").in("language_code", filters.languages);
    allowedIds = [...new Set((data ?? []).map((r) => r.school_id))];
    if (allowedIds.length === 0) return { items: [], total: 0 };
  }
  if (filters.district && (BISHKEK_DISTRICTS as readonly string[]).includes(filters.district)) {
    const { data } = await db.from("school_locations").select("school_id").ilike("district", `${filters.district}%`);
    const inDistrict = new Set((data ?? []).map((r) => r.school_id));
    allowedIds = (allowedIds ?? [...inDistrict]).filter((id) => inDistrict.has(id));
    if (allowedIds.length === 0) return { items: [], total: 0 };
  }

  let query = db.from("schools").select(CARD_SELECT, { count: "exact" }).eq("status", "published");

  if (allowedIds) query = query.in("id", allowedIds);
  if (filters.q) {
    const q = escapeLike(filters.q.toLowerCase());
    if (q) query = query.ilike("search_text", `%${q}%`);
  }
  if (filters.city) query = query.eq("cities.slug", filters.city);
  if (filters.province) query = query.eq("cities.provinces.slug", filters.province);
  if (filters.systems?.length) query = query.overlaps("education_systems", filters.systems);
  if (filters.type) query = query.eq("school_type", filters.type as SchoolCardData["school_type"]);
  if (filters.grade !== undefined) query = query.lte("grade_from", filters.grade).gte("grade_to", filters.grade);
  if (filters.tuitionMin !== undefined) query = query.gte("tuition_max", filters.tuitionMin);
  if (filters.tuitionMax !== undefined) query = query.lte("tuition_min", filters.tuitionMax);
  if (filters.transport) query = query.eq("has_transportation", true);
  if (filters.boarding) query = query.eq("has_boarding", true);
  if (filters.sports) query = query.eq("has_sports", true);

  switch (filters.sort ?? "rating") {
    case "reviews":
      query = query.order("rating_count", { ascending: false }).order("rating_avg", { ascending: false });
      break;
    case "name":
      query = query.order(`name->>${filters.lang}`, { ascending: true });
      break;
    case "updated":
      query = query.order("updated_at", { ascending: false });
      break;
    default:
      query = query.order("rating_avg", { ascending: false }).order("rating_count", { ascending: false });
  }
  query = query.order("id").range((page - 1) * pageSize, page * pageSize - 1);

  const { data, count, error } = await query;
  if (error) throw new Error(`listSchools failed: ${error.message}`);
  return { items: (data ?? []) as unknown as SchoolCardData[], total: count ?? 0 };
}

export async function getSchoolBySlug(slug: string): Promise<SchoolDetail | null> {
  const db = createPublicClient();
  const { data, error } = await db
    .from("schools")
    .select(
      "*, cities!inner(slug,name,provinces!inner(slug,name)), school_languages(language_code,is_primary), school_locations(lat,lng,address,district,google_maps_url,twogis_url), school_programs(id,kind,name,description,sort_order), school_facilities(id,facility_key,note), school_fee_items(item_key,included,extra_amount,extra_period), school_documents(id,title,url,sort_order), school_media(id,kind,url,caption,sort_order), school_faqs(id,question,answer,sort_order)"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw new Error(`getSchoolBySlug failed: ${error.message}`);
  if (!data) return null;
  const school = data as unknown as SchoolDetail;
  // PostgREST returns a one-to-one embed as an object, but guard against an array shape.
  const loc = school.school_locations as unknown;
  school.school_locations = Array.isArray(loc) ? (loc[0] ?? null) : (loc as SchoolDetail["school_locations"]);
  school.school_programs.sort((a, b) => a.sort_order - b.sort_order);
  school.school_media.sort((a, b) => a.sort_order - b.sort_order);
  school.school_documents.sort((a, b) => a.sort_order - b.sort_order);
  school.school_faqs.sort((a, b) => a.sort_order - b.sort_order);
  return school;
}

export async function getSchoolsByIds(ids: string[]): Promise<SchoolDetail[]> {
  if (ids.length === 0) return [];
  const db = createPublicClient();
  const { data, error } = await db
    .from("schools")
    .select(
      "*, cities!inner(slug,name,provinces!inner(slug,name)), school_languages(language_code,is_primary), school_locations(lat,lng,address,district,google_maps_url,twogis_url), school_programs(id,kind,name,description,sort_order), school_facilities(id,facility_key,note), school_fee_items(item_key,included,extra_amount,extra_period), school_documents(id,title,url,sort_order), school_media(id,kind,url,caption,sort_order), school_faqs(id,question,answer,sort_order)"
    )
    .in("id", ids)
    .eq("status", "published");
  if (error) throw new Error(`getSchoolsByIds failed: ${error.message}`);
  const found = (data ?? []) as unknown as SchoolDetail[];
  for (const s of found) {
    const loc = s.school_locations as unknown;
    s.school_locations = Array.isArray(loc) ? (loc[0] ?? null) : (loc as SchoolDetail["school_locations"]);
  }
  return ids.map((id) => found.find((s) => s.id === id)).filter((s): s is SchoolDetail => Boolean(s));
}

export async function getSchoolsBySlugs(slugs: string[]): Promise<SchoolDetail[]> {
  if (slugs.length === 0) return [];
  const db = createPublicClient();
  const { data } = await db.from("schools").select("id,slug").in("slug", slugs).eq("status", "published");
  const idBySlug = new Map((data ?? []).map((r) => [r.slug, r.id]));
  return getSchoolsByIds(slugs.map((s) => idBySlug.get(s)).filter((id): id is string => Boolean(id)));
}

export async function getRelatedSchools(school: SchoolDetail, limit = 4): Promise<SchoolCardData[]> {
  const db = createPublicClient();
  const { data: cityRow } = await db.from("schools").select("city_id").eq("id", school.id).single();
  let query = db
    .from("schools")
    .select(CARD_SELECT)
    .eq("status", "published")
    .neq("id", school.id)
    .order("rating_avg", { ascending: false })
    .limit(limit * 3);
  if (cityRow) query = query.eq("city_id", cityRow.city_id);
  const { data } = await query;
  const pool = (data ?? []) as unknown as SchoolCardData[];
  // Prefer schools sharing an education system, then fill with the rest of the city.
  const shared = pool.filter((s) => s.education_systems.some((e) => school.education_systems.includes(e)));
  const rest = pool.filter((s) => !shared.includes(s));
  return [...shared, ...rest].slice(0, limit);
}

export async function getSchoolReviews(schoolId: string, page = 1, pageSize = 8): Promise<{ items: ReviewData[]; total: number }> {
  const db = createPublicClient();
  const { data, count, error } = await db
    .from("reviews")
    .select("*, profiles(display_name,avatar_url)", { count: "exact" })
    .eq("school_id", schoolId)
    .eq("status", "published")
    .order("helpful_count", { ascending: false })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);
  if (error) throw new Error(`getSchoolReviews failed: ${error.message}`);
  return { items: (data ?? []) as unknown as ReviewData[], total: count ?? 0 };
}

/**
 * A random selection of published schools. Every school has the same chance, so no school is favoured
 * on the home page. Uses the uncached client so each call gives a new selection.
 */
export async function getRandomSchools(count = 6, options: { fresh?: boolean } = {}): Promise<SchoolCardData[]> {
  const db = createPublicClient({ fresh: options.fresh ?? true });
  const { data: ids } = await db.from("schools").select("id").eq("status", "published");
  const pool = (ids ?? []).map((row) => row.id);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  const chosen = pool.slice(0, count);
  if (chosen.length === 0) return [];
  const { data } = await db.from("schools").select(CARD_SELECT).in("id", chosen).eq("status", "published");
  const rows = (data ?? []) as unknown as SchoolCardData[];
  return chosen.flatMap((id) => rows.filter((r) => r.id === id));
}

export async function getMapSchools(): Promise<MapSchool[]> {
  const db = createPublicClient();
  const { data, error } = await db
    .from("schools")
    .select(
      "id,slug,name,logo_url,rating_avg,rating_count,tuition_min,tuition_max,school_type,education_systems,grade_from,grade_to,has_transportation,has_boarding,has_sports,cities!inner(slug),school_languages(language_code),school_locations!inner(lat,lng,address)"
    )
    .eq("status", "published")
    .not("school_locations.lat", "is", null);
  if (error) throw new Error(`getMapSchools failed: ${error.message}`);
  type Row = {
    id: string; slug: string; name: MapSchool["name"]; logo_url: string | null; rating_avg: number; rating_count: number;
    tuition_min: number | null; tuition_max: number | null; school_type: string; education_systems: string[];
    grade_from: number; grade_to: number; has_transportation: boolean; has_boarding: boolean; has_sports: boolean;
    cities: { slug: string }; school_languages: { language_code: string }[];
    school_locations: { lat: number; lng: number; address: MapSchool["address"] } | { lat: number; lng: number; address: MapSchool["address"] }[];
  };
  return ((data ?? []) as unknown as Row[]).map((r) => {
    const loc = Array.isArray(r.school_locations) ? r.school_locations[0]! : r.school_locations;
    return {
      id: r.id, slug: r.slug, name: r.name, logo_url: r.logo_url, rating_avg: r.rating_avg, rating_count: r.rating_count,
      tuition_min: r.tuition_min, tuition_max: r.tuition_max, school_type: r.school_type,
      education_systems: r.education_systems, grade_from: r.grade_from, grade_to: r.grade_to,
      has_transportation: r.has_transportation, has_boarding: r.has_boarding, has_sports: r.has_sports,
      city_slug: r.cities.slug, languages: r.school_languages.map((l) => l.language_code),
      lat: Number(loc.lat), lng: Number(loc.lng), address: loc.address,
    };
  });
}

export async function getSiteStats() {
  const db = createPublicClient();
  const [schools, reviews, cities, articles] = await Promise.all([
    db.from("schools").select("id", { count: "exact", head: true }).eq("status", "published"),
    db.from("reviews").select("id", { count: "exact", head: true }).eq("status", "published"),
    db.from("cities").select("id", { count: "exact", head: true }),
    db.from("articles").select("id", { count: "exact", head: true }).eq("status", "published"),
  ]);
  return {
    schools: schools.count ?? 0,
    reviews: reviews.count ?? 0,
    cities: cities.count ?? 0,
    articles: articles.count ?? 0,
  };
}

/** Slugs of published schools. Sample (demo) profiles are left out unless asked for, so they never reach the sitemap. */
export async function getAllSchoolSlugs(options: { includeDemo?: boolean } = {}): Promise<{ slug: string; updated_at: string }[]> {
  const db = createPublicClient();
  let query = db.from("schools").select("slug,updated_at").eq("status", "published");
  if (!options.includeDemo) query = query.neq("data_status", "demo");
  const { data } = await query;
  return data ?? [];
}

export async function listSchoolOptions(): Promise<{ slug: string; name: SchoolCardData["name"]; city: SchoolCardData["cities"]["name"] }[]> {
  const { data } = await createPublicClient()
    .from("schools")
    .select("slug,name,cities!inner(name)")
    .eq("status", "published")
    .order("rating_avg", { ascending: false });
  return ((data ?? []) as unknown as { slug: string; name: SchoolCardData["name"]; cities: { name: SchoolCardData["cities"]["name"] } }[]).map((r) => ({
    slug: r.slug,
    name: r.name,
    city: r.cities.name,
  }));
}

export type CategoryScores = { teaching: number | null; facilities: number | null; safety: number | null; communication: number | null };

/** Average of each optional review sub-rating (published reviews only). */
export async function getCategoryScores(schoolId: string): Promise<CategoryScores> {
  const { data } = await createPublicClient()
    .from("reviews")
    .select("rating_teaching,rating_facilities,rating_safety,rating_communication")
    .eq("school_id", schoolId)
    .eq("status", "published");
  const avg = (key: keyof CategoryScores extends never ? never : "rating_teaching" | "rating_facilities" | "rating_safety" | "rating_communication") => {
    const values = (data ?? []).map((r) => r[key]).filter((v): v is number => typeof v === "number");
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  };
  return { teaching: avg("rating_teaching"), facilities: avg("rating_facilities"), safety: avg("rating_safety"), communication: avg("rating_communication") };
}
