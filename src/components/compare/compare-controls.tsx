"use client";

import { X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCompare } from "@/components/compare/compare-provider";
import { MAX_COMPARE } from "@/lib/constants";
import type { Lang } from "@/lib/i18n/config";
import { useDict } from "@/components/i18n-provider";
import { ComparePicker } from "./compare-picker";

/** Keeps the shareable ?s=a,b,c URL and the visitor's saved selection in step. */
export function CompareSync() {
  const { slugs, setAll } = useCompare();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const fromUrl = params.get("s");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (!hydrated) return;
    if (!fromUrl && slugs.length > 0) {
      router.replace(`${pathname}?s=${slugs.join(",")}`);
    } else if (fromUrl) {
      // A shared link wins over whatever was saved earlier, so the page, the tray and the URL show the same schools.
      const shared = [...new Set(fromUrl.split(",").filter((s) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s)))].slice(0, MAX_COMPARE);
      if (shared.join(",") !== slugs.join(",")) setAll(shared);
    }
    // Only react to the first hydrated render and to URL changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, fromUrl]);
  return null;
}

export function RemoveFromCompare({ slug, current }: { slug: string; current: string[] }) {
  const { remove } = useCompare();
  const router = useRouter();
  const pathname = usePathname();
  const dict = useDict();
  return (
    <button
      type="button"
      aria-label={`${dict.compare.remove}: ${slug}`}
      title={dict.compare.remove}
      onClick={() => {
        remove(slug);
        const next = current.filter((s) => s !== slug);
        router.replace(next.length ? `${pathname}?s=${next.join(",")}` : pathname);
      }}
      className="rounded-full p-1.5 text-ink-400 hover:bg-ink-100 hover:text-danger-600"
    >
      <X className="size-4" />
    </button>
  );
}

export function AddToCompare({ current, lang }: { current: string[]; lang: Lang }) {
  return <ComparePicker current={current} lang={lang} />;
}
