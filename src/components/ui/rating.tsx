import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Read-only star rating with fractional fill. */
export function Stars({ value, size = "md", className }: { value: number; size?: "sm" | "md" | "lg"; className?: string }) {
  const px = size === "sm" ? "size-3.5" : size === "lg" ? "size-6" : "size-4.5";
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} role="img" aria-label={`${value.toFixed(1)} / 5`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <span key={i} className={cn("relative inline-block", px)}>
            <Star className={cn("absolute inset-0 text-ink-300", px)} fill="currentColor" strokeWidth={0} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className={cn("text-warning-500", px)} fill="currentColor" strokeWidth={0} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

export function RatingBadge({ value, count, emptyLabel }: { value: number; count: number; emptyLabel: string }) {
  if (count === 0) return <span className="text-caption font-medium text-ink-500">{emptyLabel}</span>;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex items-center gap-1 rounded-md bg-leaf-600 px-1.5 py-0.5 text-caption font-bold text-white">
        <Star className="size-3" fill="currentColor" strokeWidth={0} />
        {value.toFixed(1)}
      </span>
      <span className="text-caption text-ink-500">({count})</span>
    </span>
  );
}
