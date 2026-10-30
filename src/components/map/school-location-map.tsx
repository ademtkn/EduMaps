"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/components/i18n-provider";
import { LANG_META } from "@/lib/i18n/config";
import { googleEmbedUrl } from "@/lib/maps";

/** The school pin: a large blue drop with a school building on a white disc, so it reads as "a school" at a glance. */
const MARKER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="80" viewBox="0 0 46 58" role="img" aria-hidden="true">
<path d="M23 56C23 56 3 36 3 22a20 20 0 0 1 40 0c0 14-20 34-20 34z" fill="#185078" stroke="#fff" stroke-width="3"/>
<circle cx="23" cy="22" r="14" fill="#fff"/>
<g transform="translate(14 13) scale(0.75)" stroke="#185078" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<path d="M14 22v-4a2 2 0 1 0-4 0v4"/><path d="m18 10 3.447 1.724a1 1 0 0 1 .553.894V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7.382a1 1 0 0 1 .553-.894L6 10"/><path d="M18 5v17"/><path d="m4 6 7.106-3.553a2 2 0 0 1 1.788 0L20 6"/><path d="M6 5v17"/><circle cx="12" cy="9" r="2"/>
</g></svg>`;

type GoogleMaps = {
  importLibrary(name: "maps"): Promise<{ Map: new (el: HTMLElement, options: Record<string, unknown>) => unknown }>;
  importLibrary(name: "marker"): Promise<{ AdvancedMarkerElement: new (options: Record<string, unknown>) => unknown }>;
};

let loading: Promise<GoogleMaps> | null = null;

function loadGoogleMaps(key: string, language: string): Promise<GoogleMaps> {
  const existing = (window as unknown as { google?: { maps?: GoogleMaps } }).google?.maps;
  if (existing?.importLibrary) return Promise.resolve(existing);
  loading ??= new Promise<GoogleMaps>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&loading=async&language=${encodeURIComponent(language)}`;
    script.async = true;
    script.onload = () => {
      const maps = (window as unknown as { google?: { maps?: GoogleMaps } }).google?.maps;
      if (maps?.importLibrary) resolve(maps);
      else reject(new Error("Google Maps did not start"));
    };
    script.onerror = () => reject(new Error("Google Maps could not be loaded"));
    document.head.appendChild(script);
  }).catch((error) => {
    loading = null;
    throw error;
  });
  return loading;
}

/**
 * The school's Google map, shown as soon as the block is near the screen (no button to press).
 * With a Google Maps key it is a full map with the school-shaped pin; without one it is Google's own embedded map (standard red pin, which only a key can replace).
 */
export function SchoolLocationMap({ lat, lng, name, googleKey, mapId = "DEMO_MAP_ID" }: { lat: number; lng: number; name: string; googleKey: string; mapId?: string }) {
  const lang = useLang();
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setNear(true);
        observer.disconnect();
      }
    }, { rootMargin: "300px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!near || !googleKey || failed) return;
    let cancelled = false;
    (async () => {
      try {
        const maps = await loadGoogleMaps(googleKey, LANG_META[lang].htmlLang);
        const [{ Map }, { AdvancedMarkerElement }] = await Promise.all([maps.importLibrary("maps"), maps.importLibrary("marker")]);
        if (cancelled || !mapRef.current) return;
        const position = { lat, lng };
        const map = new Map(mapRef.current, { center: position, zoom: 17, mapId, gestureHandling: "cooperative", mapTypeControl: false, streetViewControl: false, fullscreenControl: true });
        const content = document.createElement("div");
        content.dataset.schoolMarker = "true";
        content.innerHTML = MARKER_SVG;
        new AdvancedMarkerElement({ map, position, title: name, content });
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => { cancelled = true; };
  }, [near, googleKey, failed, lat, lng, name, lang, mapId]);

  return (
    <div ref={ref} className="h-72 overflow-hidden rounded-card border border-ink-200 bg-ink-100 sm:h-96">
      {near && (!googleKey || failed) ? (
        <iframe
          title={name}
          src={googleEmbedUrl(lat, lng)}
          className="size-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        />
      ) : null}
      {near && googleKey && !failed ? <div ref={mapRef} className="size-full" aria-label={name} /> : null}
    </div>
  );
}
