"use client";

/** What a visitor did on a school page, recorded as anonymous counters. */
export type TrackMeta = string | undefined;

/** Sends one anonymous event. Each key is sent once per browser session. */
export function track(type: string, id: string | undefined, lang: string, meta?: TrackMeta, once?: string) {
  if (once) {
    try {
      const key = `edumaps.t.${once}`;
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "1");
    } catch {
      /* storage unavailable: send anyway */
    }
  }
  // keepalive lets the request finish even when the visitor is already leaving the page.
  void fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, id, lang, meta }), keepalive: true }).catch(() => undefined);
}

/** Where a visit came from, as a coarse category (never the address itself). */
export function visitSource(): string {
  const ref = document.referrer;
  if (!ref) return "direct";
  let url: URL;
  try {
    url = new URL(ref);
  } catch {
    return "direct";
  }
  if (url.host !== window.location.host) return /(^|\.)(google|yandex|bing|duckduckgo|yahoo)\./.test(url.host) ? "search_engine" : "external";
  const path = url.pathname.replace(/^\/(kg|ru|en)(?=\/|$)/, "") || "/";
  if (path === "/") return "home";
  if (path === "/schools" || path === "/schools/") return "directory";
  if (path.startsWith("/schools/")) return "other_school";
  if (path.startsWith("/map")) return "map";
  if (path.startsWith("/compare")) return "compare";
  if (/^\/(cities|provinces|systems)\b/.test(path)) return "city";
  if (path.startsWith("/education")) return "education";
  if (path.startsWith("/community")) return "community";
  return "internal";
}
