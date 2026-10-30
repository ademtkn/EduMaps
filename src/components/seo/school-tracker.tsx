"use client";

import { useEffect } from "react";
import { useLang } from "@/components/i18n-provider";
import { track, visitSource } from "@/lib/track-client";

const SECTIONS = ["overview", "about", "programs", "languages", "facilities", "activities", "tuition", "transportation", "documents", "gallery", "videos", "location", "reviews", "faq"];

/**
 * Anonymous interest statistics for one school page: the view and where it came from, which sections were scrolled
 * into view, and how long the page stayed open (reported in ranges). Nothing identifies the visitor.
 */
export function SchoolTracker({ schoolId }: { schoolId: string }) {
  const lang = useLang();

  useEffect(() => {
    track("school_view", schoolId, lang, visitSource(), `view.${schoolId}`);

    const seen = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = entry.target.id;
          if (seen.has(id)) continue;
          seen.add(id);
          track("section_view", schoolId, lang, id, `section.${schoolId}.${id}`);
        }
      },
      { rootMargin: "0px 0px -25% 0px", threshold: 0 }
    );
    for (const id of SECTIONS) {
      const node = document.getElementById(id);
      if (node) observer.observe(node);
    }

    // Time with the page visible, reported once when the visitor leaves or switches away.
    let visibleSince = document.visibilityState === "visible" ? Date.now() : 0;
    let total = 0;
    let sent = false;
    const flush = () => {
      if (visibleSince) total += Date.now() - visibleSince;
      visibleSince = 0;
      if (sent || total < 1000) return;
      sent = true;
      const seconds = total / 1000;
      track("time_on_page", schoolId, lang, seconds < 10 ? "lt10" : seconds < 30 ? "s10_30" : seconds < 120 ? "s30_120" : "gt120");
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
      else if (!sent) visibleSince = Date.now();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [schoolId, lang]);

  return null;
}
