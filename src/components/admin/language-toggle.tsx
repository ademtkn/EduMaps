"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLanguageEnabledAction } from "@/lib/actions/admin";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

export function LanguageToggle({ code, enabled, locked }: { code: string; enabled: boolean; locked: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={`${enabled ? "Disable" : "Enable"} ${code}`}
      disabled={pending || locked}
      title={locked ? "The default language is always enabled" : undefined}
      onClick={() =>
        start(async () => {
          const r = await setLanguageEnabledAction(code, !enabled);
          if (!r.ok) toast("error", r.error);
          router.refresh();
        })
      }
      className={cn("relative h-7 w-12 rounded-full transition-colors disabled:opacity-50", enabled ? "bg-leaf-600" : "bg-ink-300")}
    >
      <span className={cn("absolute top-0.5 size-6 rounded-full bg-white shadow transition-all", enabled ? "left-[1.375rem]" : "left-0.5")} />
    </button>
  );
}
