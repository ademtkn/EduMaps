"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Lang } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

type Ctx = { lang: Lang; dict: Dictionary };
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ lang, dict, children }: Ctx & { children: ReactNode }) {
  return <I18nContext.Provider value={{ lang, dict }}>{children}</I18nContext.Provider>;
}

function useI18n(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("I18nProvider is missing");
  return ctx;
}

export const useLang = () => useI18n().lang;
export const useDict = () => useI18n().dict;
