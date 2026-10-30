import { cleanLink, coordsFromUrl, GOOGLE_HOSTS, parseMapLink, serviceOf, type Coords, type MapLinkResult, type MapService } from "./map-links";

/**
 * Share buttons give short links (maps.app.goo.gl/…, go.2gis.com/…) that hide the coordinates. They are followed here, by hand,
 * one redirect at a time, and only while the address stays on the two services: nothing else is ever requested.
 */
const MAX_HOPS = 5;
const TIMEOUT_MS = 6_000;
// Google may send a visitor through its consent page on the way to the map.
const ALLOWED_HOP = (host: string) => serviceOf(`https://${host}/`) !== null || GOOGLE_HOSTS.test(host) || host === "consent.google.com";

type Fetch = (input: string, init: { redirect: "manual"; signal: AbortSignal; headers: Record<string, string> }) => Promise<{ status: number; headers: { get(name: string): string | null } }>;

export async function resolveMapLink(service: MapService, raw: string, doFetch: Fetch = fetch as unknown as Fetch): Promise<MapLinkResult> {
  const first = parseMapLink(service, raw);
  if (!first.ok || !first.short) return first;

  let current = first.url;
  for (let hop = 0; hop < MAX_HOPS; hop++) {
    let response;
    try {
      response = await doFetch(current, { redirect: "manual", signal: AbortSignal.timeout(TIMEOUT_MS), headers: { "user-agent": "Mozilla/5.0 (compatible; EduMapsLinkCheck/1.0)", accept: "text/html" } });
    } catch {
      return { ok: true, url: first.url, coords: null, short: true };
    }
    const location = response.status >= 300 && response.status < 400 ? response.headers.get("location") : null;
    if (!location) break;
    let next: string | null;
    try {
      next = cleanLink(new URL(location, current).toString());
    } catch {
      next = null;
    }
    if (!next || !ALLOWED_HOP(new URL(next).hostname.toLowerCase())) break;
    const coords: Coords | null = coordsFromUrl(service, next) ?? continueFromConsent(service, next);
    if (coords) return { ok: true, url: first.url, coords, short: true };
    current = next;
  }
  // The link is a real link to the service; the coordinates just could not be read from it.
  return { ok: true, url: first.url, coords: null, short: true };
}

/** consent.google.com/…?continue=<the map link> */
function continueFromConsent(service: MapService, url: string): Coords | null {
  try {
    const target = new URL(url).searchParams.get("continue");
    return target ? coordsFromUrl(service, target) : null;
  } catch {
    return null;
  }
}
