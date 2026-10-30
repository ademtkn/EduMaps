"use client";

import { ExternalLink } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { readMapLinkAction } from "@/lib/actions/admin";
import { distanceMeters, type Coords, type MapService } from "@/lib/map-links";

type Check = { state: "checking" } | { state: "error"; message: string } | { state: "ok"; coords: Coords | null; short: boolean; filled: boolean };

const NAMES: Record<MapService, string> = { google: "Google Maps", twogis: "2GIS" };
const HOW: Record<MapService, string> = {
  google: "Open the school in Google Maps, press Share, then Copy link, and paste it here.",
  twogis: "Open the school in 2GIS, press Share (or copy the address bar), and paste it here.",
};
const near = 50; // metres: treated as the same place
const far = 150; // metres: worth a warning

const fmt = (c: Coords) => `${c.lat.toFixed(6)}, ${c.lng.toFixed(6)}`;
const asCoords = (lat: number | string, lng: number | string): Coords | null => {
  if (lat === "" || lng === "") return null;
  const c = { lat: Number(lat), lng: Number(lng) };
  return Number.isFinite(c.lat) && Number.isFinite(c.lng) ? c : null;
};

/**
 * The Google Maps and 2GIS link boxes under the address. Whatever is pasted is checked on the server; the coordinates found in it fill
 * the latitude and longitude, and anything that does not agree (the two links, or a link and the numbers above) is pointed out.
 */
export function MapLinksFields({ lat, lng, google, twogis, onChange }: {
  lat: number | string; lng: number | string; google: string; twogis: string;
  onChange: (patch: Partial<{ lat: number | string; lng: number | string; google_maps_url: string; twogis_url: string }>) => void;
}) {
  const [checks, setChecks] = useState<Partial<Record<MapService, Check>>>({});
  const [, start] = useTransition();
  const checked = useRef<Partial<Record<MapService, string>>>({});
  const current = asCoords(lat, lng);
  // The newest numbers, for answers that arrive after a re-render, and which link filled them in (if one did).
  const latest = useRef({ lat, lng });
  latest.current = { lat, lng };
  const filledBy = useRef<{ service: MapService; coords: Coords } | null>(null);

  function run(service: MapService, raw: string) {
    const text = raw.trim();
    if (!text) {
      setChecks((c) => ({ ...c, [service]: undefined }));
      checked.current[service] = "";
      return;
    }
    if (checked.current[service] === text) return;
    checked.current[service] = text;
    setChecks((c) => ({ ...c, [service]: { state: "checking" } }));
    start(async () => {
      const result = await readMapLinkAction(service, text);
      if (checked.current[service] !== text) return; // a newer link was pasted meanwhile
      if (!result.ok) return setChecks((c) => ({ ...c, [service]: { state: "error", message: result.error } }));
      const data = result.data!;
      const coords = data.lat != null && data.lng != null ? { lat: data.lat, lng: data.lng } : null;
      const now = latest.current;
      const empty = now.lat === "" && now.lng === "";
      // Google's pin is exact, while 2GIS gives the middle of the map: the pin replaces numbers that only 2GIS filled in.
      const from = filledBy.current;
      const replaceable = service === "google" && from?.service === "twogis" && Number(now.lat) === from.coords.lat && Number(now.lng) === from.coords.lng;
      const fill = Boolean(coords) && (empty || replaceable);
      if (coords && fill) filledBy.current = { service, coords };
      setChecks((c) => ({ ...c, [service]: { state: "ok", coords, short: data.short, filled: fill } }));
      const patch: Parameters<typeof onChange>[0] = { [service === "google" ? "google_maps_url" : "twogis_url"]: data.url };
      if (coords && fill) Object.assign(patch, { lat: coords.lat, lng: coords.lng });
      onChange(patch);
    });
  }

  const google_ = checks.google?.state === "ok" ? checks.google.coords : null;
  const twogis_ = checks.twogis?.state === "ok" ? checks.twogis.coords : null;
  const between = google_ && twogis_ ? distanceMeters(google_, twogis_) : null;

  function message(service: MapService) {
    const check = checks[service];
    if (!check) return null;
    if (check.state === "checking") return <p className="mt-1.5 text-caption text-ink-500" role="status">Checking the link…</p>;
    if (check.state === "error") return <p className="mt-1.5 text-caption font-medium text-danger-600" role="alert">{check.message}</p>;
    if (!check.coords) {
      return <p className="mt-1.5 text-caption text-warning-700" role="status">Link accepted, but no coordinates could be read from it. {current ? "The coordinates above are kept." : "Enter them above, or paste the other service’s link."}</p>;
    }
    const d = current ? distanceMeters(current, check.coords) : null;
    if (d === null) return <p className="mt-1.5 text-caption text-success-600" role="status">Coordinates found: {fmt(check.coords)}</p>;
    if (d <= near) return <p className="mt-1.5 text-caption text-success-600" role="status">{check.filled ? `✔ Coordinates filled in from this link: ${fmt(check.coords)}` : "✔ Same place as the coordinates above."}</p>;
    return (
      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-caption font-medium text-warning-700" role="alert">
        <span>This link is {d >= 1000 ? `${(d / 1000).toFixed(1)} km` : `${Math.round(d)} m`} from the coordinates above ({fmt(check.coords)}).</span>
        <Button type="button" size="sm" variant="outline" onClick={() => onChange({ lat: check.coords!.lat, lng: check.coords!.lng })}>Use this link’s coordinates</Button>
      </div>
    );
  }

  const field = (service: MapService, value: string, key: "google_maps_url" | "twogis_url") => (
    <Field label={`${NAMES[service]} link (optional)`} htmlFor={`f-${service}`} hint={HOW[service]}>
      <div className="flex gap-2">
        <Input
          id={`f-${service}`} inputMode="url" autoComplete="off" spellCheck={false} placeholder="https://" value={value}
          onChange={(e) => { onChange({ [key]: e.target.value }); setChecks((c) => ({ ...c, [service]: undefined })); checked.current[service] = undefined; }}
          onPaste={(e) => { const text = e.clipboardData.getData("text"); if (text.trim()) window.setTimeout(() => run(service, text), 0); }}
          onBlur={(e) => run(service, e.target.value)}
        />
        {value.trim() && checks[service]?.state === "ok" ? (
          <Button asChild type="button" variant="outline" size="icon" aria-label={`Open the ${NAMES[service]} link to check it`}>
            <a href={value.trim().startsWith("http") ? value.trim() : `https://${value.trim()}`} target="_blank" rel="noopener noreferrer"><ExternalLink /></a>
          </Button>
        ) : null}
      </div>
      {message(service)}
    </Field>
  );

  return (
    <div className="space-y-4 rounded-card border border-ink-200 bg-ink-50 p-4">
      <p className="text-small font-medium text-ink-800">Map links: paste them straight from the apps, the coordinates are read for you</p>
      <div className="grid gap-5 sm:grid-cols-2">
        {field("google", google, "google_maps_url")}
        {field("twogis", twogis, "twogis_url")}
      </div>
      {between !== null && between > far ? (
        <p role="alert" className="text-caption font-medium text-warning-700">The two links are {between >= 1000 ? `${(between / 1000).toFixed(1)} km` : `${Math.round(between)} m`} apart. Check that both show the school.</p>
      ) : between !== null ? (
        <p role="status" className="text-caption text-success-600">✔ Both links show the same place.</p>
      ) : null}
    </div>
  );
}
