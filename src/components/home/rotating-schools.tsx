"use client";

import { Pause, Play, Shuffle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AdCard } from "@/components/ads/ad-card";
import { useDict, useLang } from "@/components/i18n-provider";
import { SchoolCard } from "@/components/schools/school-card";
import { Button } from "@/components/ui/button";
import type { AdData, SchoolCardData } from "@/lib/data/types";
import { useRotation } from "@/lib/use-rotation";

type Selection = { schools: SchoolCardData[]; ad: AdData | null; adIndex: number };

/** Five schools and, when a campaign is running, one clearly labelled advertisement at a random position. */
function arrange(schools: SchoolCardData[], ad: AdData | null, adIndex: number) {
  if (!ad) return schools.slice(0, 6).map((school) => ({ kind: "school" as const, school }));
  const cells: ({ kind: "school"; school: SchoolCardData } | { kind: "ad"; ad: AdData })[] = schools.slice(0, 5).map((school) => ({ kind: "school", school }));
  cells.splice(Math.min(adIndex, cells.length), 0, { kind: "ad", ad });
  return cells;
}

/**
 * Home page selection of schools. Every visit shows a different random set, and while the visitor is idle it
 * refreshes by itself every 15 seconds (only this section, never the whole page).
 */
export function RotatingSchools({ initial }: { initial: Selection }) {
  const dict = useDict();
  const lang = useLang();
  const t = dict.home.discover;
  const [selection, setSelection] = useState<Selection>(initial);
  const [version, setVersion] = useState(0);
  const busy = useRef(false);

  const refresh = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const response = await fetch(`/api/home/schools?lang=${lang}`, { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { schools: SchoolCardData[]; ad: AdData | null };
      if (!data.schools?.length) return;
      setSelection({ schools: data.schools, ad: data.ad, adIndex: Math.floor(Math.random() * 6) });
      setVersion((v) => v + 1);
    } catch {
      /* keep what is on screen */
    } finally {
      busy.current = false;
    }
  }, [lang]);

  const { paused, setPaused, attach, hover } = useRotation(refresh, 15_000);

  // The page itself is cached, so the first selection can be a few minutes old: swap in a fresh one right away.
  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cells = arrange(selection.schools, selection.ad, selection.adIndex);

  return (
    <div ref={attach as never} {...hover} data-testid="rotating-schools">
      <div key={version} className={version > 0 ? "swap-in grid gap-6 sm:grid-cols-2 lg:grid-cols-3" : "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"}>
        {cells.map((cell, i) =>
          cell.kind === "school" ? (
            <SchoolCard key={cell.school.id} school={cell.school} lang={lang} dict={dict} priority={i < 3} />
          ) : (
            <AdCard key={cell.ad.id} ad={cell.ad} lang={lang} dict={dict} className="h-full" />
          )
        )}
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-small text-ink-600">
        <p>{paused ? t.paused : t.status}</p>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" aria-pressed={paused} onClick={() => setPaused(!paused)}>
            {paused ? <Play /> : <Pause />}{paused ? t.resume : t.pause}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => void refresh()}><Shuffle />{t.shuffle}</Button>
        </div>
      </div>
    </div>
  );
}
