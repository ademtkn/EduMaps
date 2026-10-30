"use client";

import { MAX_COMPARE } from "@/lib/constants";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "edumap.compare.v1";

type CompareState = {
  slugs: string[];
  has: (slug: string) => boolean;
  /** Returns "full" when the limit is reached. */
  toggle: (slug: string) => "added" | "removed" | "full";
  remove: (slug: string) => void;
  clear: () => void;
  /** Replaces the whole selection (used when opening a shared comparison link). */
  setAll: (slugs: string[]) => void;
};

const CompareContext = createContext<CompareState | null>(null);

function read(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed)
      ? parsed.filter((s): s is string => typeof s === "string" && /^[a-z0-9-]+$/.test(s)).slice(0, MAX_COMPARE)
      : [];
  } catch {
    return [];
  }
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    setSlugs(read());
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setSlugs(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = useCallback((next: string[]) => {
    setSlugs(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable (private mode): keep in-memory state */
    }
  }, []);

  const has = useCallback((slug: string) => slugs.includes(slug), [slugs]);
  const remove = useCallback((slug: string) => persist(slugs.filter((s) => s !== slug)), [persist, slugs]);
  const clear = useCallback(() => persist([]), [persist]);
  const setAll = useCallback((next: string[]) => persist(next.slice(0, MAX_COMPARE)), [persist]);
  const toggle = useCallback(
    (slug: string): "added" | "removed" | "full" => {
      if (slugs.includes(slug)) {
        persist(slugs.filter((s) => s !== slug));
        return "removed";
      }
      if (slugs.length >= MAX_COMPARE) return "full";
      persist([...slugs, slug]);
      return "added";
    },
    [persist, slugs]
  );

  const value = useMemo(() => ({ slugs, has, toggle, remove, clear, setAll }), [slugs, has, toggle, remove, clear, setAll]);
  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("CompareProvider is missing");
  return ctx;
}
