"use client";

import { Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveGuestVoiceAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { Check, I18nField, type I18nValue } from "./fields";

export type GuestVoice = { id?: string; author_name: string; author_title: string; quote: I18nValue; consent_note: string; status: "pending" | "published"; is_demo: boolean };

/** Add or edit an opinion from an invited guest. The permission note is required and stays in the record. */
export function GuestVoiceEditor({ voice }: { voice?: GuestVoice }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [v, setV] = useState<GuestVoice>(voice ?? { author_name: "", author_title: "", quote: {}, consent_note: "", status: "published", is_demo: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const idSuffix = voice?.id ?? "new";

  return (
    <>
      {voice ? <Button size="sm" variant="ghost" onClick={() => setOpen(true)}><Pencil /> Edit</Button> : <Button onClick={() => setOpen(true)}><Plus /> Add a guest opinion</Button>}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title={voice ? "Edit guest opinion" : "Add a guest opinion"} className="sm:max-w-xl">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" htmlFor={`g-name-${idSuffix}`} error={errors.author_name}>
                <Input id={`g-name-${idSuffix}`} value={v.author_name} onChange={(e) => setV({ ...v, author_name: e.target.value })} />
              </Field>
              <Field label="Role or organisation" htmlFor={`g-title-${idSuffix}`} hint="e.g. Director, Example Foundation" error={errors.author_title}>
                <Input id={`g-title-${idSuffix}`} value={v.author_title} onChange={(e) => setV({ ...v, author_title: e.target.value })} />
              </Field>
            </div>
            <I18nField label="Opinion (up to 400 characters)" multiline rows={4} maxLength={400} value={v.quote} error={errors.quote} onChange={(quote) => setV({ ...v, quote })} />
            <Field label="How did this person give permission?" htmlFor={`g-consent-${idSuffix}`} hint="Required. For example: written agreement by email on 12 Nov 2026. Only you see this note." error={errors.consent_note}>
              <Textarea id={`g-consent-${idSuffix}`} rows={2} maxLength={300} value={v.consent_note} onChange={(e) => setV({ ...v, consent_note: e.target.value })} />
            </Field>
            <Field label="Status" htmlFor={`g-status-${idSuffix}`}>
              <Select id={`g-status-${idSuffix}`} value={v.status} onChange={(e) => setV({ ...v, status: e.target.value as GuestVoice["status"] })}>
                <option value="published">Shown on the home page</option><option value="pending">Draft (not shown)</option>
              </Select>
            </Field>
            <Check label="Sample content (shows a “Demo” badge)" checked={v.is_demo} onChange={(x) => setV({ ...v, is_demo: x })} />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    setErrors({});
                    const result = await saveGuestVoiceAction({ ...v, id: voice?.id ?? null });
                    if (!result.ok) {
                      setErrors(result.fieldErrors ?? {});
                      return toast("error", result.error);
                    }
                    toast("success", "Saved");
                    setOpen(false);
                    router.refresh();
                  })
                }
              >
                {pending ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
