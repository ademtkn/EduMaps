"use client";

import { Check, Scale } from "lucide-react";
import { useDict, useLang } from "@/components/i18n-provider";
import { track } from "@/lib/track-client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { useCompare } from "./compare-provider";

export function CompareButton({ slug, schoolId, size = "sm", className }: { slug: string; schoolId?: string; size?: "sm" | "md"; className?: string }) {
  const { has, toggle } = useCompare();
  const { toast } = useToast();
  const dict = useDict();
  const lang = useLang();
  const active = has(slug);

  return (
    <Button
      variant={active ? "soft" : "outline"}
      size={size}
      aria-pressed={active}
      className={cn("relative z-10", className)}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        const result = toggle(slug);
        if (result === "full") toast("error", dict.schools.compareFull);
        if (result === "added" && schoolId) track("compare_add", schoolId, lang, undefined, `compare.${schoolId}`);
      }}
    >
      {active ? <Check /> : <Scale />}
      {active ? dict.schools.inCompare : dict.schools.addToCompare}
    </Button>
  );
}
