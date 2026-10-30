"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import type { AdminResult } from "@/lib/actions/admin";

type Option = { value: string; label: string; variant?: ButtonProps["variant"] };

/** A note box plus decision buttons. Each button runs the server action with the chosen status and the note. */
export function DecisionControls({
  action, id, options, placeholder = "Note for the record or for the person who sent it (optional)",
}: {
  action: (id: string, status: never, note?: string) => Promise<AdminResult<unknown>>;
  id: string;
  options: Option[];
  placeholder?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();

  return (
    <div className="space-y-2">
      <Textarea aria-label="Note" rows={2} className="min-h-0 text-small" placeholder={placeholder} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Button
            key={o.value}
            type="button"
            size="sm"
            variant={o.variant ?? "outline"}
            disabled={pending}
            onClick={() =>
              start(async () => {
                const result = await action(id, o.value as never, note.trim() || undefined);
                if (!result.ok) return toast("error", result.error);
                setNote("");
                router.refresh();
              })
            }
          >
            {o.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
