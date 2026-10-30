export type Coords = { lat: number; lng: number };

/** Distance between two points in metres (haversine). */
export function distanceMeters(a: Coords, b: Coords): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** A visitor's position as it travels in the page address: Kyrgyzstan only, rounded to 0.01° (about 1 km), so it never pinpoints a home. */
export function parseNear(value: string | null | undefined): Coords | undefined {
  const m = value?.match(/^(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)$/);
  if (!m) return undefined;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (lat < 39 || lat > 44 || lng < 69 || lng > 81) return undefined;
  return { lat: Math.round(lat * 100) / 100, lng: Math.round(lng * 100) / 100 };
}
