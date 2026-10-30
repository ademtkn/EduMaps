import { gradeTone, letterGrade } from "@/lib/grade";
import { cn } from "@/lib/utils";

const TONE = {
  excellent: "bg-leaf-600 text-white",
  good: "bg-brand-600 text-white",
  fair: "bg-warning-500 text-white",
  poor: "bg-danger-600 text-white",
};
const SIZE = { sm: "size-9 text-small", md: "size-12 text-h3", lg: "size-16 text-h2", xl: "size-24 text-display" };

/** Letter grade square. `score` is the 5-point review average; renders a neutral dash when unrated. */
export function GradeBadge({ score, count, size = "md", className }: { score: number; count: number; size?: keyof typeof SIZE; className?: string }) {
  const rated = count > 0;
  const letter = rated ? letterGrade(score) : "–";
  return (
    <span
      role="img"
      aria-label={rated ? `${letter} (${score.toFixed(1)} / 5)` : "–"}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl font-extrabold leading-none shadow-sm",
        rated ? TONE[gradeTone(letter)] : "bg-ink-200 text-ink-500",
        SIZE[size],
        className
      )}
    >
      {letter}
    </span>
  );
}
