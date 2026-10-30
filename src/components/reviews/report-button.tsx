"use client";

import { Flag } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { reportContentAction } from "@/lib/actions/content";
import { errorText } from "@/lib/form-errors";
import { localizedPath } from "@/lib/i18n/config";
import { useAuth } from "@/components/auth/auth-provider";
import { useDict, useLang } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";

export function ReportButton({ entityType, entityId }: { entityType: "review" | "post" | "comment"; entityId: string }) {
  const { member } = useAuth();
  const dict = useDict();
  const lang = useLang();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function send() {
    setBusy(true);
    const result = await reportContentAction({ entityType, entityId, reason });
    setBusy(false);
    if (!result.ok) return setError(errorText(dict, result.error === "validation" ? "too_short" : result.error));
    setOpen(false);
    setReason("");
    toast("success", dict.reviews.reportSent);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (!member) router.push(`${localizedPath(lang, "/auth/login")}?next=${encodeURIComponent(pathname)}`);
          else setOpen(true);
        }}
        className="inline-flex items-center gap-1 text-caption font-medium text-ink-500 hover:text-danger-600"
      >
        <Flag className="size-3.5" /> {dict.reviews.report}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title={dict.reviews.reportTitle} closeLabel={dict.common.close}>
          <Field label={dict.reviews.reportReason} htmlFor={`report-${entityId}`} error={error}>
            <Textarea id={`report-${entityId}`} value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} />
          </Field>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>{dict.common.cancel}</Button>
            <Button variant="danger" onClick={send} disabled={busy || reason.trim().length < 3}>{dict.reviews.reportSend}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
