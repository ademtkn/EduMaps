/**
 * Links copied from Google Maps and 2GIS. An administrator pastes whatever the app gave them; this module checks that it really
 * is a link to that service and reads the coordinates out of it, so nobody has to type numbers by hand.
 * Pure functions only (no network): short links are followed in map-links-resolve.ts.
 */

export type MapService = "google" | "twogis";

/** Only these domains count as the services themselves: "google.com.evil.example" or "evilgoogle.com" never match. */
export const GOOGLE_HOSTS = /^(www\.|maps\.)?google\.(com|kg|ru|kz|uz|by|de|fr|es|it|co\.uk|com\.tr|com\.ua)$/i;
const GOOGLE_SHORT_HOSTS = new Set(["maps.app.goo.gl", "goo.gl"]);
export const TWOGIS_HOSTS = /^(www\.)?2gis\.(kg|ru|kz|com|ae|uz|cl|cz|it|ua|ge|az)$/i;
const TWOGIS_SHORT_HOSTS = new Set(["go.2gis.com"]);

export const MAX_MAP_LINK = 500;

// Kyrgyzstan, with a little room (same limits as the database check on cities, wider than any real school).
const LAT = [39, 44] as const;
const LNG = [69, 81] as const;

export type Coords = { lat: number; lng: number };
export type MapLinkResult =
  | { ok: true; url: string; coords: Coords | null; short: boolean }
  | { ok: false; error: string };

/** Adds https:// when the link was pasted without it, removes spaces and invisible characters, and refuses anything that is not https. */
export function cleanLink(raw: string): string | null {
  const text = raw.replace(/[​-‏‪-‮⁠﻿]/g, "").trim();
  if (!text || /\s/.test(text)) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `https://${text}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol === "http:") url.protocol = "https:";
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function serviceOf(url: string): { service: MapService; short: boolean } | null {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
  if (GOOGLE_SHORT_HOSTS.has(host)) return { service: "google", short: true };
  if (TWOGIS_SHORT_HOSTS.has(host)) return { service: "twogis", short: true };
  if (GOOGLE_HOSTS.test(host)) return { service: "google", short: false };
  if (TWOGIS_HOSTS.test(host)) return { service: "twogis", short: false };
  return null;
}

const inKyrgyzstan = (c: Coords) => c.lat >= LAT[0] && c.lat <= LAT[1] && c.lng >= LNG[0] && c.lng <= LNG[1];
const num = (s: string | undefined) => (s === undefined || s === "" ? NaN : Number(s));
// Six decimals (about 10 cm), the precision the database keeps.
const six = (n: number) => Math.round(n * 1e6) / 1e6;
const pair = (lat: number, lng: number): Coords | null => (Number.isFinite(lat) && Number.isFinite(lng) && inKyrgyzstan({ lat, lng }) ? { lat: six(lat), lng: six(lng) } : null);

/**
 * Google Maps: the pin of the place (!3d<lat>!4d<lng>) is exact; "@lat,lng" is only the middle of the visible map,
 * so it is the second choice. Search links carry "lat,lng" in q / query / ll / destination.
 */
export function googleCoords(url: string): Coords | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const full = decodeURIComponent(parsed.pathname + parsed.search + parsed.hash).replace(/\+/g, " ");
  const pin = full.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (pin) {
    const c = pair(num(pin[1]), num(pin[2]));
    if (c) return c;
  }
  for (const key of ["q", "query", "ll", "destination", "daddr"]) {
    const value = parsed.searchParams.get(key);
    const m = value?.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
    if (m) {
      const c = pair(num(m[1]), num(m[2]));
      if (c) return c;
    }
  }
  const view = full.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  return view ? pair(num(view[1]), num(view[2])) : null;
}

/** 2GIS writes the map position as m=<longitude>,<latitude>/<zoom>: longitude first. */
export function twoGisCoords(url: string): Coords | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const m = parsed.searchParams.get("m")?.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
  return m ? pair(num(m[2]), num(m[1])) : null;
}

export function coordsFromUrl(service: MapService, url: string): Coords | null {
  return service === "google" ? googleCoords(url) : twoGisCoords(url);
}

const NAMES: Record<MapService, string> = { google: "Google Maps", twogis: "2GIS" };

/** Checks one pasted link for the given service. A short link has no coordinates until it is followed (see the resolver). */
export function parseMapLink(service: MapService, raw: string): MapLinkResult {
  const url = cleanLink(raw);
  if (!url) return { ok: false, error: "This does not look like a web link. Copy it again with the Share button." };
  if (url.length > MAX_MAP_LINK) return { ok: false, error: `The link is longer than ${MAX_MAP_LINK} characters. Use the Share button to get a shorter one.` };
  const kind = serviceOf(url);
  if (!kind) return { ok: false, error: `This is not a ${NAMES[service]} link.` };
  if (kind.service !== service) return { ok: false, error: `This is a ${NAMES[kind.service]} link. Paste it in the ${NAMES[kind.service]} field.` };
  return { ok: true, url, short: kind.short, coords: kind.short ? null : coordsFromUrl(service, url) };
}

/** Distance between two points in metres (haversine). */
export function distanceMeters(a: Coords, b: Coords): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.min(1, Math.sqrt(h)));
}
