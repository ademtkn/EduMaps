import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-caption font-semibold leading-5 whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "bg-ink-100 text-ink-700",
        brand: "bg-brand-50 text-brand-800",
        leaf: "bg-leaf-50 text-leaf-700",
        success: "bg-success-50 text-success-600",
        warning: "bg-warning-50 text-warning-700",
        danger: "bg-danger-50 text-danger-700",
        info: "bg-info-50 text-info-600",
        outline: "border border-ink-300 bg-white text-ink-700",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
);

export function Badge({ className, tone, ...props }: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
