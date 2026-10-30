"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Accessible star picker (radio group semantics). value 0 = not rated. */
export function RatingInput({
  value, onChange, label, allowClear = false, size = "lg",
}: { value: number; onChange: (v: number) => void; label: string; allowClear?: boolean; size?: "md" | "lg" }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} / 5`}
          onClick={() => onChange(allowClear && value === n ? 0 : n)}
          className="rounded p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={cn(size === "lg" ? "size-8" : "size-6", n <= value ? "text-warning-500" : "text-ink-300")}
            fill="currentColor"
            strokeWidth={0}
          />
        </button>
      ))}
    </div>
  );
}
