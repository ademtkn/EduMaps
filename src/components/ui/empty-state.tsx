import type { ReactNode } from "react";

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-card border border-dashed border-ink-300 bg-white px-6 py-14 text-center">
      {icon ? <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-700">{icon}</div> : null}
      <h3 className="text-h3 font-semibold">{title}</h3>
      {description ? <p className="mt-2 max-w-md text-small text-ink-600">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
