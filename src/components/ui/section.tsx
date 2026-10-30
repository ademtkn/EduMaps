import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LLink } from "./localized-link";

export function SectionHeading({
  title, description, href, linkLabel, className,
}: { title: string; description?: string; href?: string; linkLabel?: string; className?: string }) {
  return (
    <div className={cn("mb-6 flex items-end justify-between gap-4", className)}>
      <div>
        <h2 className="text-h2 font-semibold">{title}</h2>
        {description ? <p className="mt-1.5 max-w-2xl text-body text-ink-600">{description}</p> : null}
      </div>
      {href && linkLabel ? (
        <LLink href={href} className="hidden shrink-0 text-small font-semibold text-brand-700 hover:text-brand-900 sm:inline">
          {linkLabel} →
        </LLink>
      ) : null}
    </div>
  );
}

export function PageHeader({ title, description, children, className }: { title: string; description?: string; children?: ReactNode; className?: string }) {
  return (
    <div className={cn("border-b border-ink-200 bg-white", className)}>
      <div className="container-page py-8 sm:py-10">
        {children}
        <h1 className="text-h1 font-bold sm:text-[2.5rem]">{title}</h1>
        {description ? <p className="mt-3 max-w-3xl text-body text-ink-600">{description}</p> : null}
      </div>
    </div>
  );
}
