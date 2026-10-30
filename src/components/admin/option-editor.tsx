"use client";

import { EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteCatalogItemAction, saveCatalogItemAction } from "@/lib/actions/admin";
import { FACILITY_ICON_NAMES } from "@/components/schools/facility-icons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { Check, I18nField, slugify, type I18nValue } from "./fields";

export type OptionItem = { key: string; name: I18nValue; sort_order: number; is_active: boolean; icon?: string };
type Type = "system" | "facility" | "language" | "fee";

export function OptionEditor({ type, item }: { type: Type; item?: OptionItem }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [v, setV] = useState<OptionItem>(item ?? { key: "", name: {}, sort_order: 100, is_active: true, icon: "check" });
  const [pending, start] = useTransition();
  const noun = { system: "education system", facility: "facility", language: "language", fee: "fee item" }[type];

  return (
    <>
      {item ? <Button size="sm" variant="ghost" onClick={() => setOpen(true)}><Pencil /> Edit</Button> : <Button size="sm" variant="outline" onClick={() => setOpen(true)}><Plus /> Add</Button>}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title={item ? `Edit ${noun}` : `Add ${noun}`} className="sm:max-w-xl">
          <div className="space-y-4">
            <I18nField label="Name" requiredEn value={v.name} onChange={(name) => setV((p) => ({ ...p, name, key: item || type === "language" ? p.key : slugify(name.en ?? "").replace(/-/g, "_") }))} hint="Visitors see the name in their own language." />
            <div className="grid grid-cols-2 gap-4">
              <Field label={type === "language" ? "Language code" : "Key"} htmlFor={`k-${type}-${item?.key ?? "new"}`} hint={item ? "The key cannot be changed." : type === "language" ? "2–3 letters, e.g. de" : "Lowercase, underscores"}>
                <Input id={`k-${type}-${item?.key ?? "new"}`} value={v.key} disabled={Boolean(item)} onChange={(e) => setV((p) => ({ ...p, key: e.target.value }))} />
              </Field>
              <Field label="Display order" htmlFor={`o-${type}-${item?.key ?? "new"}`}>
                <Input id={`o-${type}-${item?.key ?? "new"}`} type="number" value={v.sort_order} onChange={(e) => setV((p) => ({ ...p, sort_order: Number(e.target.value) }))} />
              </Field>
            </div>
            {type === "facility" || type === "fee" ? (
              <Field label="Icon" htmlFor="icon">
                <Select id="icon" value={v.icon ?? "check"} onChange={(e) => setV((p) => ({ ...p, icon: e.target.value }))}>
                  {FACILITY_ICON_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
                </Select>
              </Field>
            ) : null}
            <Check label="Active" hint="Hidden options disappear from filters and the school editor, but schools that already use them keep showing them." checked={v.is_active} onChange={(is_active) => setV((p) => ({ ...p, is_active }))} />
          </div>
          <div className="mt-6 flex items-center justify-between gap-2">
            {item ? (
              <Button variant="ghost" className="text-danger-600" disabled={pending} onClick={() => {
                if (!window.confirm("Delete this option?")) return;
                start(async () => {
                  const r = await deleteCatalogItemAction(type, item.key);
                  if (!r.ok) return toast("error", r.error);
                  setOpen(false);
                  router.refresh();
                });
              }}><Trash2 /> Delete</Button>
            ) : <span />}
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button disabled={pending} onClick={() => start(async () => {
                const r = await saveCatalogItemAction({ type, key: v.key, isNew: !item, name: v.name, icon: v.icon ?? "check", sort_order: v.sort_order, is_active: v.is_active });
                if (!r.ok) return toast("error", r.error);
                setOpen(false);
                router.refresh();
              })}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function HiddenMark() {
  return <span className="inline-flex items-center gap-1 text-caption text-ink-500"><EyeOff className="size-3.5" /> Hidden</span>;
}
