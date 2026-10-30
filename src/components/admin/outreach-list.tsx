"use client";

import { ChevronDown } from "lucide-react";
import { Input, Label } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { OutreachRow, useSigner, type OutreachSchool } from "./outreach-row";

const STATUS_LABEL = { sent: "Message sent", replied: "Replied", confirmed: "Details confirmed", declined: "Asked not to be listed" } as const;
const STATUS_TONE = { sent: "info", replied: "warning", confirmed: "success", declined: "danger" } as const;

export type OutreachListItem = OutreachSchool & { city: string; dataStatus: string };

export function OutreachList({ items }: { items: OutreachListItem[] }) {
  const [signer, setSigner] = useSigner();
  return (
    <div className="space-y-4">
      <div className="max-w-md rounded-card border border-ink-200 bg-white p-4 shadow-card">
        <Label htmlFor="outreach-signer">Your name and role (the signature)</Label>
        <Input id="outreach-signer" value={signer} maxLength={120} placeholder="e.g. Aigul Asanova, EduMaps.kg team" onChange={(e) => setSigner(e.target.value)} />
        <p className="mt-1.5 text-caption text-ink-500">Remembered in this browser. It is added to every message below.</p>
      </div>

      {items.length === 0 ? <p className="rounded-card border border-ink-200 bg-white px-5 py-12 text-center text-small text-ink-500">No schools here.</p> : null}
      {items.map((school) => (
        <details key={school.id} className="group rounded-card border border-ink-200 bg-white shadow-card">
          <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 px-5 py-4 [&::-webkit-details-marker]:hidden">
            <span className="font-semibold text-ink-900">{school.name.en}</span>
            <span className="text-caption text-ink-500">{school.city}</span>
            {school.dataStatus === "unverified" ? <Badge tone="warning">Not confirmed</Badge> : null}
            {school.outreach ? <Badge tone={STATUS_TONE[school.outreach.status]}>{STATUS_LABEL[school.outreach.status]}</Badge> : <Badge tone="neutral">Not contacted</Badge>}
            <span className="ml-auto flex items-center gap-3 text-caption text-ink-500">
              {school.whatsapp || school.phone ? "WhatsApp/phone" : null}
              {school.email ? "email" : null}
              <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
            </span>
          </summary>
          <OutreachRow school={school} signer={signer} />
        </details>
      ))}
    </div>
  );
}
