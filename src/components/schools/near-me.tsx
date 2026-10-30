"use client";

import { LocateFixed, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useDict } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";

/**
 * "Schools near me". The browser asks for permission only when the button is pressed. The position is rounded to about a kilometre
 * and carried in the page address so the server can sort by distance; it is not stored or linked to anyone.
 */
export function NearMe({ active }: { active: boolean }) {
  const dict = useDict();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function go(next: URLSearchParams) {
    next.delete("page");
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function locate() {
    setMessage(null);
    if (!("geolocation" in navigator)) return setMessage(dict.schools.nearUnavailable);
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setBusy(false);
        const next = new URLSearchParams(params.toString());
        next.set("near", `${position.coords.latitude.toFixed(2)},${position.coords.longitude.toFixed(2)}`);
        next.set("sort", "nearest");
        go(next);
      },
      (error) => {
        setBusy(false);
        setMessage(error.code === error.PERMISSION_DENIED ? dict.schools.nearDenied : dict.schools.nearUnavailable);
      },
      { timeout: 10_000, maximumAge: 5 * 60_000 },
    );
  }

  function clear() {
    const next = new URLSearchParams(params.toString());
    next.delete("near");
    if (next.get("sort") === "nearest") next.delete("sort");
    go(next);
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      {active ? (
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 py-1 pl-3 pr-1.5 text-small font-medium text-brand-800">
          <LocateFixed className="size-4" aria-hidden />
          <span>{dict.schools.nearActive}</span>
          <button type="button" onClick={clear} aria-label={dict.schools.nearClear} className="inline-flex size-6 items-center justify-center rounded-full hover:bg-brand-100"><X className="size-4" /></button>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={locate}><LocateFixed />{dict.schools.nearMe}</Button>
      )}
      {active ? <p className="text-caption text-ink-500">{dict.schools.nearNoCoords}</p> : null}
      {message ? <p role="alert" className="max-w-md text-caption font-medium text-danger-600">{message}</p> : null}
    </div>
  );
}
