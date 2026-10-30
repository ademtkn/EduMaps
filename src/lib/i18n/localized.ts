import { DEFAULT_LANG, type Lang } from "./config";

/** A translatable database field: {"kg": "...", "ru": "...", "en": "..."} */
export type I18nText = Partial<Record<Lang, string>> | null | undefined;

const FALLBACK_ORDER: Record<Lang, Lang[]> = {
  kg: ["kg", "ru", "en"],
  ru: ["ru", "kg", "en"],
  en: ["en", "ru", "kg"],
};

/** Resolve a translatable field for a language, falling back to the closest available translation. */
export function tr(value: I18nText, lang: Lang): string {
  if (!value) return "";
  for (const code of FALLBACK_ORDER[lang] ?? FALLBACK_ORDER[DEFAULT_LANG]) {
    const text = value[code];
    if (typeof text === "string" && text.trim() !== "") return text;
  }
  return "";
}

/** True when the field has a real translation in exactly this language. */
export function hasTranslation(value: I18nText, lang: Lang): boolean {
  return Boolean(value && typeof value[lang] === "string" && value[lang]!.trim() !== "");
}
