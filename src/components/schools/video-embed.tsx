"use client";

import { Play } from "lucide-react";
import { useState } from "react";
import { useDict } from "@/components/i18n-provider";

/** Click-to-load YouTube embed (privacy friendly and keeps the page fast). */
export function VideoEmbed({ embedUrl, title }: { embedUrl: string; title: string }) {
  const dict = useDict();
  const [playing, setPlaying] = useState(false);

  return (
    <div className="relative aspect-video overflow-hidden rounded-card bg-ink-900">
      {playing ? (
        <iframe
          src={`${embedUrl}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 size-full"
        />
      ) : (
        <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0 size-full" aria-label={`${dict.school.playVideo}: ${title}`}>
          {/* No picture is fetched from YouTube: nothing is requested from Google until the visitor presses play. */}
          <span className="absolute inset-0 bg-[radial-gradient(40rem_20rem_at_20%_0%,rgb(38_121_180/0.55),transparent),linear-gradient(135deg,var(--color-brand-900),var(--color-brand-700))]" aria-hidden="true" />
          <span className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 bg-gradient-to-t from-black/60 to-transparent p-4 text-left text-white">
            <span className="line-clamp-2 text-small font-semibold">{title}</span>
            <span className="text-caption text-white/80">{dict.school.videoNote}</span>
          </span>
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-white/95 text-brand-800 shadow-lift transition group-hover:scale-105">
              <Play className="ml-1 size-7" fill="currentColor" />
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
