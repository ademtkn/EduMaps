import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const tones = {
  info: { box: "border-info-600/20 bg-info-50 text-ink-800", icon: <Info className="size-5 text-info-600" /> },
  success: { box: "border-success-600/20 bg-success-50 text-ink-800", icon: <CheckCircle2 className="size-5 text-success-600" /> },
  warning: { box: "border-warning-500/30 bg-warning-50 text-ink-800", icon: <TriangleAlert className="size-5 text-warning-500" /> },
  danger: { box: "border-danger-600/20 bg-danger-50 text-ink-800", icon: <AlertCircle className="size-5 text-danger-600" /> },
};

export function Alert({
  tone = "info", title, children, className,
}: { tone?: keyof typeof tones; title?: ReactNode; children?: ReactNode; className?: string }) {
  const t = tones[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("flex gap-3 rounded-card border p-4 text-small", t.box, className)}>
      <span className="mt-0.5 shrink-0">{t.icon}</span>
      <div className="min-w-0">
        {title ? <p className="font-semibold text-ink-900">{title}</p> : null}
        {children ? <div className={title ? "mt-1" : ""}>{children}</div> : null}
      </div>
    </div>
  );
}
