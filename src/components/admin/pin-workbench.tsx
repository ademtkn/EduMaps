"use client";

import { CheckCircle2, ExternalLink, Loader2, SkipForward } from "lucide-react";
import { useMemo, useState } from "react";
import { saveSchoolPinAction } from "@/lib/actions/admin";
import { coordsFromUrl, serviceOf } from "@/lib/map-links";
import { googleEmbedUrl } from "@/lib/maps";
import { Button } from "@/components/ui/button";

export type PinItem = {
  id: string;
  name: string;
  city: string;
  address: string;
  twogisUrl: string | null;
  googleUrl: string | null;
};

const COORDS = /^\s*(-?\d{1,2}(?:[.,]\d+)?)\s*[,; ]\s*(-?\d{1,3}(?:[.,]\d+)?)\s*$/;

function typedCoords(value: string) {
  const match = COORDS.exec(value);
  if (!match) return null;
  const lat = Number(match[1]!.replace(",", "."));
  const lng = Number(match[2]!.replace(",", "."));
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

/**
 * Walks the published schools that have no coordinates.
 *
 * Paste what the Google Maps / 2GIS share button gives (or type "lat, lng"), check the pin on the
 * preview, press save: the workbench stores it and moves to the next school. Short links are
 * resolved on the server, so the preview appears only for links that already carry the position.
 */
export function PinWorkbench({ items }: { items: PinItem[] }) {
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(0);
  const [done, setDone] = useState(false);

  const current = items[index];
  const preview = useMemo(() => {
    const typed = typedCoords(value);
    if (typed) return typed;
    const detected = serviceOf(value.trim());
    if (!detected) return null;
    return coordsFromUrl(detected.service, value.trim());
  }, [value]);

  const next = () => {
    setValue("");
    setError("");
    if (index + 1 >= items.length) setDone(true);
    else setIndex(index + 1);
  };

  const save = async () => {
    if (!current) return;
    setBusy(true);
    setError("");
    const typed = typedCoords(value);
    const result = await saveSchoolPinAction(
      typed ? { schoolId: current.id, lat: typed.lat, lng: typed.lng } : { schoolId: current.id, link: value.trim() }
    );
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSaved((count) => count + 1);
    next();
  };

  if (items.length === 0 || done) {
    return (
      <div className="rounded-card border border-leaf-200 bg-leaf-50 p-8 text-center">
        <CheckCircle2 className="mx-auto size-10 text-leaf-600" />
        <p className="mt-3 text-h3 font-semibold text-leaf-800">
          {items.length === 0 ? "Every published school already has a map pin." : `Done: ${saved} pin(s) added in this pass.`}
        </p>
        <p className="mt-1 text-small text-ink-700">Reload the page to start a new pass over the remaining profiles.</p>
      </div>
    );
  }

  const remaining = items.length - index;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-small font-semibold text-ink-800">
          {index + 1} of {items.length} in this pass · {remaining} left · {saved} saved
        </p>
        <div className="h-1.5 w-48 overflow-hidden rounded-full bg-ink-200" aria-hidden="true">
          <div className="h-full rounded-full bg-leaf-600 transition-all" style={{ width: `${(index / items.length) * 100}%` }} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="rounded-card border border-ink-200 bg-white p-6 shadow-card">
          <h2 className="text-h3 font-semibold">{current.name}</h2>
          <p className="mt-1 text-small text-ink-600">{current.city}</p>
          <p className="mt-1 text-small text-ink-500">{current.address || "No street address recorded."}</p>
          <div className="mt-3 flex flex-wrap gap-3 text-small">
            {current.twogisUrl ? (
              <a href={current.twogisUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline">
                2GIS <ExternalLink className="size-3.5" />
              </a>
            ) : null}
            {current.googleUrl ? (
              <a href={current.googleUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline">
                Google Maps <ExternalLink className="size-3.5" />
              </a>
            ) : null}
          </div>

          <form
            className="mt-5 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (value.trim() && !busy) void save();
            }}
          >
            <label className="block">
              <span className="mb-1 block text-small font-semibold text-ink-800">Share link or coordinates</span>
              <input
                autoFocus
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="https://maps.app.goo.gl/… or 42.8746, 74.5698"
                className="h-11 w-full rounded-control border border-ink-300 bg-white px-3 text-small focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-100"
              />
            </label>
            <p className="text-caption text-ink-600">
              {preview
                ? `Pin: ${preview.lat.toFixed(5)}, ${preview.lng.toFixed(5)}`
                : "Open the school in Google Maps or 2GIS, press Share, copy the link and paste it here."}
            </p>
            {error ? <p className="text-small font-medium text-danger-600" role="alert">{error}</p> : null}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={busy || value.trim().length === 0}>
                {busy ? <Loader2 className="animate-spin" /> : null}
                Save and next
              </Button>
              <Button type="button" variant="ghost" disabled={busy} onClick={next}>
                <SkipForward /> Skip
              </Button>
            </div>
          </form>
        </div>

        <div className="overflow-hidden rounded-card border border-ink-200 bg-ink-50">
          {preview ? (
            <iframe
              key={`${preview.lat},${preview.lng}`}
              title="Pin preview"
              src={googleEmbedUrl(preview.lat, preview.lng)}
              className="h-72 w-full lg:h-full"
              loading="lazy"
            />
          ) : (
            <div className="flex h-72 items-center justify-center p-6 text-center text-small text-ink-500 lg:h-full">
              The map preview appears once the link or the coordinates contain a position.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
