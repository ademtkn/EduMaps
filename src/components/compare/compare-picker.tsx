"use client";

import { Check, Loader2, Plus, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCompare } from "@/components/compare/compare-provider";
import { useDict } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MAX_COMPARE } from "@/lib/constants";
import type { Lang } from "@/lib/i18n/config";

type Suggestion = { slug: string; name: string; city: string };

/**
 * Searchable "add a school" control for the comparison page.
 *
 * It used to be a native <select> holding every published school (~650 options): unusable on a phone
 * and a heavy query for the page. The dialog now asks `/api/search/suggest`, which searches the same
 * index as the site search, so the comparison page no longer loads the whole directory.
 */
export function ComparePicker({ current, lang }: { current: string[]; lang: Lang }) {
  const dict = useDict();
  const router = useRouter();
  const pathname = usePathname();
  const { slugs, toggle } = useCompare();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const sequence = useRef(0);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    const ticket = ++sequence.current;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search/suggest?lang=${lang}&q=${encodeURIComponent(term)}`);
        const data = (await response.json()) as { schools?: Suggestion[] };
        if (ticket === sequence.current) setResults(data.schools ?? []);
      } catch {
        if (ticket === sequence.current) setResults([]);
      } finally {
        if (ticket === sequence.current) setLoading(false);
      }
    }, 220);
    return () => clearTimeout(timer);
  }, [query, lang]);

  if (current.length >= MAX_COMPARE) return null;

  const add = (slug: string) => {
    if (!slugs.includes(slug)) toggle(slug);
    const next = [...current, slug].slice(0, MAX_COMPARE);
    router.replace(`${pathname}?s=${next.join(",")}`);
    setOpen(false);
    setQuery("");
    setResults([]);
  };

  const visible = results.filter((result) => !current.includes(result.slug));

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        <Plus />
        {dict.compare.addMore}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title={dict.compare.addMore} closeLabel={dict.common.close}>
          <div className="space-y-3">
            <label className="relative block">
              <span className="sr-only">{dict.common.search}</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={dict.compare.searchPlaceholder}
                className="h-11 w-full rounded-control border border-ink-300 bg-white pl-9 pr-9 text-body focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-100"
              />
              {loading ? <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-ink-400" /> : null}
            </label>

            <p className="text-caption text-ink-500" aria-live="polite">
              {query.trim().length < 2 ? dict.compare.searchHint : visible.length === 0 && !loading ? dict.common.noResults : ""}
            </p>

            <ul className="max-h-[50vh] space-y-1 overflow-y-auto">
              {visible.map((result) => (
                <li key={result.slug}>
                  <button
                    type="button"
                    onClick={() => add(result.slug)}
                    className="flex w-full items-center justify-between gap-3 rounded-control px-3 py-2.5 text-left text-small hover:bg-ink-100"
                  >
                    <span>
                      {result.name}
                      <span className="block text-caption text-ink-500">{result.city}</span>
                    </span>
                    <Plus className="size-4 shrink-0 text-ink-400" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
            {current.length > 0 ? (
              <p className="flex items-center gap-1.5 text-caption text-ink-500">
                <Check className="size-3.5" aria-hidden="true" />
                {current.length} / {MAX_COMPARE}
              </p>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
