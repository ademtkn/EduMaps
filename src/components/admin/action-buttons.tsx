"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import type { AdminResult } from "@/lib/actions/admin";

/** Runs an admin server action, toasts failures and refreshes the page data on success. */
export function ActionButton({
  action, args = [], confirm, children, onDone, ...props
}: {
  /** A server action reference (pass `args`), or a closure when used from another client component. */
  action: (...args: never[]) => Promise<AdminResult<unknown>>;
  args?: unknown[];
  confirm?: string;
  children: ReactNode;
  onDone?: () => void;
} & Omit<ButtonProps, "onClick">) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  return (
    <Button
      {...props}
      disabled={pending || props.disabled}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        start(async () => {
          const result = await (action as (...a: unknown[]) => Promise<AdminResult<unknown>>)(...args);
          if (!result.ok) return toast("error", result.error);
          onDone?.();
          router.refresh();
        });
      }}
    >
      {children}
    </Button>
  );
}

/** Reject/hide with a moderator note shown back to the author. */
export function NoteDialogButton({
  label, title, action, variant = "danger", size = "sm", placeholder = "Reason shown to the author (optional)",
}: {
  label: ReactNode; title: string; action: (note: string) => Promise<AdminResult<unknown>>;
  variant?: ButtonProps["variant"]; size?: ButtonProps["size"]; placeholder?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();

  return (
    <>
      <Button variant={variant} size={size} onClick={() => setOpen(true)}>{label}</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title={title}>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder={placeholder} aria-label={placeholder} />
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              variant={variant}
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const result = await action(note);
                  if (!result.ok) return toast("error", result.error);
                  setOpen(false);
                  setNote("");
                  router.refresh();
                })
              }
            >
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
