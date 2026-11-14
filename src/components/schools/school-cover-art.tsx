import { Blocks, BookOpen, GraduationCap, School } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Cover shown when a school has no photograph yet.
 *
 * Almost every listing was imported from public directories, so four out of five have no picture.
 * An empty grey block makes the directory look broken, and a stock photo would be a lie about the
 * school. This draws a calm, recognisable illustration instead: the institution kind is visible at
 * a glance, nothing pretends to be a photograph, and the card keeps the same shape until a real
 * picture arrives. Colours come from the design tokens only.
 */
const KINDS = {
  school: { icon: School, bg: "from-brand-100 via-brand-50 to-leaf-50", ink: "text-brand-700" },
  kindergarten: { icon: Blocks, bg: "from-leaf-100 via-leaf-50 to-brand-50", ink: "text-leaf-700" },
  college: { icon: GraduationCap, bg: "from-brand-50 via-white to-brand-100", ink: "text-brand-800" },
  madrasa: { icon: BookOpen, bg: "from-leaf-50 via-white to-brand-100", ink: "text-leaf-800" },
} as const;

type Kind = keyof typeof KINDS;

/** Small, stable hash so each school keeps the same composition between page loads. */
function variation(slug: string) {
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  return hash % 3;
}

const PLACEMENT = [
  { icon: "-bottom-1 -right-1 rotate-[-4deg]", one: "-left-10 -top-12", two: "-bottom-16 right-16" },
  { icon: "-bottom-2 -left-2 rotate-[4deg]", one: "-right-10 -top-14", two: "-bottom-20 -left-12" },
  { icon: "-right-2 top-1 rotate-[6deg]", one: "-left-12 -bottom-10", two: "-right-16 -top-16" },
] as const;

export function SchoolCoverArt({ kind, slug, className, iconClassName }: { kind?: string | null; slug: string; className?: string; iconClassName?: string }) {
  const palette = KINDS[(kind ?? "school") as Kind] ?? KINDS.school;
  const spot = PLACEMENT[variation(slug)]!;
  const Icon = palette.icon;

  return (
    <div aria-hidden="true" className={cn("relative size-full overflow-hidden bg-gradient-to-br", palette.bg, className)}>
      <span className={cn("absolute size-48 rounded-full bg-white/50 blur-2xl", spot.one)} />
      <span className={cn("absolute size-56 rounded-full bg-white/35 blur-3xl", spot.two)} />
      <Icon
        strokeWidth={0.85}
        className={cn("absolute size-32 opacity-[0.3] sm:size-36", palette.ink, spot.icon, iconClassName)}
      />
    </div>
  );
}
