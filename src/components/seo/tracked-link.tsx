"use client";

import type { AnchorHTMLAttributes } from "react";
import { useLang } from "@/components/i18n-provider";
import { track } from "@/lib/track-client";

export type ContactKind = "whatsapp" | "phone" | "email" | "website" | "directions" | "google_maps" | "gis2" | "share" | "document";

/** A normal link that also counts one anonymous click per visitor session. The link works even if counting fails. */
export function TrackedLink({ schoolId, kind, onClick, ...props }: { schoolId: string; kind: ContactKind } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  const lang = useLang();
  return (
    <a
      {...props}
      onClick={(event) => {
        track("contact_click", schoolId, lang, kind, `click.${schoolId}.${kind}`);
        onClick?.(event);
      }}
    />
  );
}
