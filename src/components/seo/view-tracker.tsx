"use client";

import { useEffect } from "react";
import { useLang } from "@/components/i18n-provider";

/** Records one view per browser session for a published entity. */
export function ViewTracker({ type, id, dedupe }: { type: "school_view" | "article_view" | "post_view" | "map_open" | "search" | "compare"; id?: string; dedupe?: string }) {
  const lang = useLang();
  useEffect(() => {
    const key = `edumap.view.${type}.${id ?? "-"}.${dedupe ?? ""}`;
    try {
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "1");
    } catch {
      /* storage unavailable: still count the view */
    }
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, id, lang }),
      keepalive: true,
    });
  }, [type, id, dedupe, lang]);
  return null;
}
