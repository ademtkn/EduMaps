export const LANGS = ["kg", "ru", "en"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "kg";
export const LANG_COOKIE = "NEXT_LOCALE";

export const LANG_META: Record<
  Lang,
  { label: string; native: string; htmlLang: string; hreflang: string; ogLocale: string; intl: string }
> = {
  kg: { label: "Kyrgyz", native: "Кыргызча", htmlLang: "ky", hreflang: "ky", ogLocale: "ky_KG", intl: "ky-KG" },
  ru: { label: "Russian", native: "Русский", htmlLang: "ru", hreflang: "ru", ogLocale: "ru_RU", intl: "ru-KG" },
  en: { label: "English", native: "English", htmlLang: "en", hreflang: "en", ogLocale: "en_US", intl: "en-GB" },
};

export function isLang(value: unknown): value is Lang {
  return typeof value === "string" && (LANGS as readonly string[]).includes(value);
}

/** Prefix a site path with a language segment: localizedPath("ru", "/schools") -> "/ru/schools" */
export function localizedPath(lang: Lang, path = "/"): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return clean === "/" ? `/${lang}` : `/${lang}${clean}`;
}

/** Remove a leading language segment from a pathname. */
export function stripLang(pathname: string): { lang: Lang | null; path: string } {
  const match = pathname.match(/^\/(kg|ru|en)(\/.*)?$/);
  if (!match) return { lang: null, path: pathname || "/" };
  return { lang: match[1] as Lang, path: match[2] || "/" };
}
