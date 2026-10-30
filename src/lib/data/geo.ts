import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import type { I18nText } from "@/lib/i18n/localized";

export type ProvinceData = { id: string; slug: string; name: I18nText; description: I18nText; sort_order: number };
export type CityData = {
  id: string; slug: string; name: I18nText; description: I18nText; lat: number; lng: number; zoom: number;
  province_id: string; provinces: { slug: string; name: I18nText };
};

export async function listProvinces(): Promise<ProvinceData[]> {
  const { data } = await createPublicClient().from("provinces").select("*").order("sort_order");
  return (data ?? []) as unknown as ProvinceData[];
}

export async function listCities(): Promise<CityData[]> {
  const { data } = await createPublicClient()
    .from("cities")
    .select("*, provinces!inner(slug,name)")
    .order("sort_order");
  return (data ?? []) as unknown as CityData[];
}

export async function getCity(slug: string): Promise<CityData | null> {
  const { data } = await createPublicClient()
    .from("cities")
    .select("*, provinces!inner(slug,name)")
    .eq("slug", slug)
    .maybeSingle();
  return (data as unknown as CityData) ?? null;
}

export async function getProvince(slug: string): Promise<ProvinceData | null> {
  const { data } = await createPublicClient().from("provinces").select("*").eq("slug", slug).maybeSingle();
  return (data as unknown as ProvinceData) ?? null;
}

export async function schoolCountsByCity(): Promise<Record<string, number>> {
  const { data } = await createPublicClient()
    .from("schools")
    .select("cities!inner(slug)")
    .eq("status", "published");
  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as unknown as { cities: { slug: string } }[]) {
    counts[row.cities.slug] = (counts[row.cities.slug] ?? 0) + 1;
  }
  return counts;
}

export async function listEnabledLanguages(): Promise<("kg" | "ru" | "en")[]> {
  try {
    const { data } = await createPublicClient().from("languages").select("code").eq("is_enabled", true);
    const codes = (data ?? []).map((r) => r.code as "kg" | "ru" | "en");
    return codes.length > 0 ? codes : ["kg", "ru", "en"];
  } catch {
    return ["kg", "ru", "en"];
  }
}
