import type { Lang } from "@/lib/i18n/config";
import { EN } from "./en";
import { KG } from "./kg";
import { RU } from "./ru";
import type { LegalDoc, LegalKind } from "./types";

export type { LegalDoc, LegalKind, LegalSection } from "./types";

const DOCS: Record<Lang, Record<LegalKind, LegalDoc>> = { en: EN, ru: RU, kg: KG };

export function getLegalDoc(kind: LegalKind, lang: Lang): LegalDoc {
  return DOCS[lang][kind];
}
