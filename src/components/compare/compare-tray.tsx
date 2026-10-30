"use client";

import { Scale, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { localizedPath, stripLang } from "@/lib/i18n/config";
import { fmt } from "@/lib/i18n/fmt";
import { useDict, useLang } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { MAX_COMPARE } from "@/lib/constants";
import { useCompare } from "./compare-provider";

/** Floating bar that appears as soon as a school is added to the comparison. */
export function CompareTray() {
  const { slugs, clear } = useCompare();
  const dict = useDict();
  const lang = useLang();
  const { path } = stripLang(usePathname());

  if (slugs.length === 0 || path.startsWith("/compare") || path.startsWith("/map")) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:bottom-4 sm:px-0">
      <div className="mx-auto flex max-w-xl items-center gap-3 rounded-card border border-ink-200 bg-white p-3 shadow-lift">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-leaf-50 text-leaf-700">
          <Scale className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-small font-semibold text-ink-900">{dict.compare.tray}</p>
          <p className="text-caption text-ink-600">{fmt(dict.compare.traySchools, { count: slugs.length, max: MAX_COMPARE })}</p>
        </div>
        <Button asChild size="sm" variant="secondary">
          <Link href={`${localizedPath(lang, "/compare")}?s=${slugs.join(",")}`}>{dict.compare.open}</Link>
        </Button>
        <button
          type="button"
          onClick={clear}
          aria-label={dict.compare.clear}
          className="rounded-full p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-900"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
