"use client";

import { ChevronLeft, ChevronRight, Pause, Play, Quote } from "lucide-react";
import { useState } from "react";
import { useDict, useLang } from "@/components/i18n-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LLink } from "@/components/ui/localized-link";
import type { TestimonialData } from "@/lib/data/testimonials";
import { fmt } from "@/lib/i18n/fmt";
import { tr } from "@/lib/i18n/localized";
import { cn } from "@/lib/utils";
import { useRotation } from "@/lib/use-rotation";

/** What people say about the site: one opinion at a time, changing every 15 seconds while the visitor is idle. */
export function RotatingVoices({ voices }: { voices: TestimonialData[] }) {
  const dict = useDict();
  const lang = useLang();
  const t = dict.voices;
  const [index, setIndex] = useState(0);
  const [version, setVersion] = useState(0);
  const go = (next: number) => {
    setIndex((next + voices.length) % voices.length);
    setVersion((v) => v + 1);
  };
  const { paused, setPaused, attach, hover } = useRotation(() => go(index + 1), 15_000);
  const voice = voices[index]!;

  return (
    <section ref={attach as never} {...hover} aria-labelledby="voices-title" className="container-page pt-16">
      <div className="mb-8 max-w-3xl">
        <h2 id="voices-title" className="text-h2 font-semibold">{t.title}</h2>
        <p className="mt-2 text-body text-ink-600">{t.description}</p>
      </div>
      <figure className="relative overflow-hidden rounded-card border border-ink-200 bg-white p-8 shadow-card sm:p-12" aria-roledescription="carousel">
        <Quote aria-hidden="true" className="absolute right-6 top-6 size-14 text-brand-100" />
        <div key={version} className={cn("relative max-w-3xl", version > 0 && "swap-in")}>
          <blockquote className="text-xl font-medium leading-relaxed text-ink-900 sm:text-2xl">“{tr(voice.quote, lang)}”</blockquote>
          <figcaption className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="font-semibold text-ink-900">{voice.author_name}</span>
            {voice.author_title ? <span className="text-small text-ink-600">{voice.author_title}</span> : null}
            <Badge tone={voice.kind === "invited" ? "info" : "leaf"}>{voice.kind === "invited" ? t.tagGuest : t.tagMember}</Badge>
            {voice.is_demo ? <Badge tone="warning">{dict.schools.badgeDemo}</Badge> : null}
          </figcaption>
        </div>
        <div className="relative mt-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5" role="group" aria-label={t.title}>
            {voices.map((v, i) => (
              <button
                key={v.id}
                type="button"
                aria-label={fmt(t.goTo, { n: i + 1 })}
                aria-current={i === index}
                onClick={() => go(i)}
                className={cn("h-2 rounded-full transition-all", i === index ? "w-6 bg-brand-600" : "w-2 bg-ink-300 hover:bg-ink-400")}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-caption text-ink-500 sm:inline">{paused ? "" : t.status}</span>
            <Button type="button" size="sm" variant="outline" aria-label={t.previous} onClick={() => go(index - 1)} disabled={voices.length < 2}><ChevronLeft /></Button>
            <Button type="button" size="sm" variant="outline" aria-label={t.next} onClick={() => go(index + 1)} disabled={voices.length < 2}><ChevronRight /></Button>
            <Button type="button" size="sm" variant="outline" aria-pressed={paused} onClick={() => setPaused(!paused)} disabled={voices.length < 2}>
              {paused ? <Play /> : <Pause />}{paused ? t.resume : t.pause}
            </Button>
          </div>
        </div>
      </figure>
      <p className="mt-4 text-right text-small"><LLink href="/feedback" className="font-semibold text-brand-700 hover:underline">{t.share} →</LLink></p>
    </section>
  );
}
