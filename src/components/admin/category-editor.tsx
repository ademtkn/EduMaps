"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteCategoryAction, saveCategoryAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { I18nField, slugify, type I18nValue } from "./fields";

type Category = { id?: string; slug: string; name: I18nValue; description: I18nValue; sort_order: number };

export function CategoryEditor({ type, category }: { type: "article" | "community"; category?: Category & { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [v, setV] = useState<Category>(category ?? { slug: "", name: {}, description: {}, sort_order: 0 });
  const [pending, start] = useTransition();

  return (
    <>
      {category ? (
        <Button size="sm" variant="ghost" onClick={() => setOpen(true)}><Pencil /> Edit</Button>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}><Plus /> New category</Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title={category ? "Edit category" : "New category"} className="sm:max-w-xl">
          <div className="space-y-4">
            <I18nField label="Name" requiredEn value={v.name} onChange={(name) => setV((p) => ({ ...p, name, slug: category ? p.slug : slugify(name.en ?? "") }))} />
            <I18nField label="Description" multiline rows={2} value={v.description} onChange={(description) => setV((p) => ({ ...p, description }))} />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Slug" htmlFor={`slug-${category?.id ?? "new"}`}><Input id={`slug-${category?.id ?? "new"}`} value={v.slug} onChange={(e) => setV((p) => ({ ...p, slug: e.target.value }))} /></Field>
              <Field label="Sort order" htmlFor={`sort-${category?.id ?? "new"}`}><Input id={`sort-${category?.id ?? "new"}`} type="number" value={v.sort_order} onChange={(e) => setV((p) => ({ ...p, sort_order: Number(e.target.value) }))} /></Field>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between gap-2">
            {category ? (
              <Button variant="ghost" className="text-danger-600" disabled={pending} onClick={() => {
                if (!window.confirm("Delete this category?")) return;
                start(async () => {
                  const r = await deleteCategoryAction(type, category.id);
                  if (!r.ok) return toast("error", r.error);
                  setOpen(false);
                  router.refresh();
                });
              }}><Trash2 /> Delete</Button>
            ) : <span />}
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button disabled={pending} onClick={() => start(async () => {
                const r = await saveCategoryAction({ ...v, id: category?.id ?? null, type });
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
