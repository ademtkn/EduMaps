"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { fmt } from "@/lib/i18n/fmt";
import { useDict } from "@/components/i18n-provider";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MediaImage } from "@/components/ui/media-image";

type Photo = { id: string; url: string; caption: string };

export function SchoolGallery({ photos }: { photos: Photo[] }) {
  const dict = useDict();
  const [index, setIndex] = useState<number | null>(null);
  const current = index === null ? null : photos[index];

  const step = (delta: number) => setIndex((i) => (i === null ? i : (i + delta + photos.length) % photos.length));

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((photo, i) => (
          <li key={photo.id} className={i === 0 ? "col-span-2 row-span-2" : undefined}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              aria-label={photo.caption || fmt(dict.school.photo, { n: i + 1 })}
              className="group relative block aspect-[4/3] w-full overflow-hidden rounded-card bg-ink-100"
              style={i === 0 ? { aspectRatio: "auto", height: "100%", minHeight: "12rem" } : undefined}
            >
              <MediaImage
                src={photo.url}
                alt={photo.caption}
                fill
                loading="lazy"
                sizes={i === 0 ? "(min-width: 640px) 66vw, 100vw" : "(min-width: 640px) 33vw, 50vw"}
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={index !== null} onOpenChange={(open) => !open && setIndex(null)}>
        <DialogContent title={current?.caption || fmt(dict.school.photo, { n: (index ?? 0) + 1 })} closeLabel={dict.common.close} className="sm:max-w-4xl">
          {current ? (
            <div className="relative">
              <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-ink-100">
                <MediaImage src={current.url} alt={current.caption} fill sizes="(min-width: 1024px) 896px, 100vw" className="object-contain" />
              </div>
              {photos.length > 1 ? (
                <div className="mt-4 flex items-center justify-between">
                  <button type="button" onClick={() => step(-1)} aria-label={dict.common.previous} className="rounded-full p-2 hover:bg-ink-100"><ChevronLeft /></button>
                  <span className="text-small text-ink-600">{(index ?? 0) + 1} / {photos.length}</span>
                  <button type="button" onClick={() => step(1)} aria-label={dict.common.next} className="rounded-full p-2 hover:bg-ink-100"><ChevronRight /></button>
                </div>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
