import "server-only";
import { getCatalog } from "@/lib/data/catalog";
import type { Lang } from "./config";
import type en from "./dictionaries/en.json";
import { tr } from "./localized";

type Base = typeof en;
/**
 * The JSON dictionary plus the admin-managed option lists. Labels for education systems, languages and
 * facilities come from the database (so admins can add or rename them) and are merged into the same
 * places the UI already reads, with the `catalog` lists giving the active keys in display order.
 */
export type Dictionary = Omit<Base, "schools" | "school"> & {
  schools: Omit<Base["schools"], "systems" | "languageNames"> & { systems: Record<string, string>; languageNames: Record<string, string> };
  school: Omit<Base["school"], "facilityNames" | "feeItemNames"> & { facilityNames: Record<string, string>; feeItemNames: Record<string, string> };
  catalog: { systems: string[]; languages: string[]; facilities: string[]; facilityIcons: Record<string, string>; feeItems: string[]; feeItemIcons: Record<string, string> };
};

const loaders: Record<Lang, () => Promise<Base>> = {
  kg: () => import("./dictionaries/kg.json").then((m) => m.default as Base),
  ru: () => import("./dictionaries/ru.json").then((m) => m.default as Base),
  en: () => import("./dictionaries/en.json").then((m) => m.default as Base),
};

export async function getDictionary(lang: Lang): Promise<Dictionary> {
  const [base, catalog] = await Promise.all([loaders[lang](), getCatalog().catch(() => null)]);
  const dict = structuredClone(base) as unknown as Dictionary;
  dict.catalog = { systems: Object.keys(dict.schools.systems), languages: Object.keys(dict.schools.languageNames), facilities: Object.keys(dict.school.facilityNames), facilityIcons: {}, feeItems: Object.keys(dict.school.feeItemNames), feeItemIcons: {} };
  if (!catalog) return dict;

  const label = (item: { key: string; name: Parameters<typeof tr>[0] }) => tr(item.name, lang);
  dict.schools.systems = Object.fromEntries(catalog.systems.map((i) => [i.key, label(i)]));
  dict.schools.languageNames = Object.fromEntries(catalog.languages.map((i) => [i.key, label(i)]));
  dict.school.facilityNames = Object.fromEntries(catalog.facilities.map((i) => [i.key, label(i)]));
  dict.school.feeItemNames = Object.fromEntries(catalog.feeItems.map((i) => [i.key, label(i)]));
  dict.catalog = {
    systems: catalog.systems.filter((i) => i.is_active).map((i) => i.key),
    languages: catalog.languages.filter((i) => i.is_active).map((i) => i.key),
    facilities: catalog.facilities.filter((i) => i.is_active).map((i) => i.key),
    facilityIcons: Object.fromEntries(catalog.facilities.map((i) => [i.key, i.icon ?? "check"])),
    feeItems: catalog.feeItems.filter((i) => i.is_active).map((i) => i.key),
    feeItemIcons: Object.fromEntries(catalog.feeItems.map((i) => [i.key, i.icon ?? "check"])),
  };
  return dict;
}
