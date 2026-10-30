"use client";

import { useEffect, useRef } from "react";
import { useLang } from "@/components/i18n-provider";

/** Counts one impression when at least half of the ad is visible. */
export function AdTracker({ adId, children, className }: { adId: string; children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const lang = useLang();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const key = `edumap.ad.${adId}`;
    try {
      if (window.sessionStorage.getItem(key)) return;
    } catch {
      /* ignore */
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        try {
          window.sessionStorage.setItem(key, "1");
        } catch {
          /* ignore */
        }
        void fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "ad_impression", id: adId, lang }),
          keepalive: true,
        });
      },
      { threshold: 0.5 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [adId, lang]);

  return <div ref={ref} className={className}>{children}</div>;
}
