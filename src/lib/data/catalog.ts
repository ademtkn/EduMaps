import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import type { I18nText } from "@/lib/i18n/localized";

export type CatalogItem = { key: string; name: I18nText; sort_order: number; is_active: boolean; icon?: string };
export type Catalog = { systems: CatalogItem[]; facilities: CatalogItem[]; languages: CatalogItem[]; feeItems: CatalogItem[] };

/** Admin-managed option lists (education systems, facilities, languages of instruction), cached with the public data. */
export async function getCatalog(): Promise<Catalog> {
  const db = createPublicClient();
  const [systems, facilities, languages, feeItems] = await Promise.all([
    db.from("education_systems").select("key,name,sort_order,is_active").order("sort_order"),
    db.from("facility_types").select("key,name,icon,sort_order,is_active").order("sort_order"),
    db.from("language_options").select("code,name,sort_order,is_active").order("sort_order"),
    db.from("fee_items").select("key,name,icon,sort_order,is_active").order("sort_order"),
  ]);
  return {
    systems: (systems.data ?? []) as unknown as CatalogItem[],
    facilities: (facilities.data ?? []) as unknown as CatalogItem[],
    feeItems: (feeItems.data ?? []) as unknown as CatalogItem[],
    languages: ((languages.data ?? []) as unknown as (Omit<CatalogItem, "key"> & { code: string })[]).map(({ code, ...rest }) => ({ key: code, ...rest })),
  };
}
