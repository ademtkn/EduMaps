export const SCHOOL_TYPES = ["public", "private", "international", "specialized"] as const;
export const AD_PLACEMENTS = ["banner", "sidebar", "featured_article", "home_grid"] as const;
export const AD_CUSTOMER_TYPES = ["language_school", "summer_camp", "robotics_center", "edu_company", "edu_event", "other"] as const;

/** Allow-list for post-login redirects: same-site relative paths only. */
export function safeNextPath(next: string | null | undefined, fallback: string): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\") || /^\/[a-z]+:/i.test(next)) return fallback;
  return next;
}

/** Limits per school profile: enough to show the school well, small enough to keep pages fast and storage cheap. */
export const MAX_DOCUMENTS = 8;

/** Listing plans (administrators only). They only change how many gallery photos and videos a school may show. */
export const PLANS = ["free", "pro"] as const;
export type Plan = (typeof PLANS)[number];
export const PLAN_LIMITS: Record<Plan, { photos: number; videos: number }> = { free: { photos: 2, videos: 1 }, pro: { photos: 10, videos: 5 } };

/** Maximum number of schools in one comparison. */
export const MAX_COMPARE = 4;

/** Districts of Bishkek used by the directory filter. School records keep the district as free text; it is matched by its first word. */
export const BISHKEK_DISTRICTS = ["leninsky", "oktyabrsky", "pervomaisky", "sverdlovsky"] as const;
export type BishkekDistrict = (typeof BISHKEK_DISTRICTS)[number];

/** Maps a stored district ("Oktyabrsky district") to its filter key, or null when it is not one of the known districts. */
export function districtKey(value: string | null | undefined): BishkekDistrict | null {
  const first = value?.trim().toLowerCase().split(/\s+/)[0] ?? "";
  return (BISHKEK_DISTRICTS as readonly string[]).includes(first) ? (first as BishkekDistrict) : null;
}
