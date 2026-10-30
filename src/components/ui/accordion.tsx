"use client";

import * as Primitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export const Accordion = Primitive.Root;

export function AccordionItem({ className, ...props }: ComponentPropsWithoutRef<typeof Primitive.Item>) {
  return <Primitive.Item className={cn("border-b border-ink-200 last:border-0", className)} {...props} />;
}

export function AccordionTrigger({ className, children, ...props }: ComponentPropsWithoutRef<typeof Primitive.Trigger>) {
  return (
    <Primitive.Header>
      <Primitive.Trigger
        className={cn("group flex w-full items-center justify-between gap-4 py-4 text-left text-body font-semibold text-ink-900", className)}
        {...props}
      >
        {children}
        <ChevronDown className="size-5 shrink-0 text-ink-500 transition-transform group-data-[state=open]:rotate-180" />
      </Primitive.Trigger>
    </Primitive.Header>
  );
}

export function AccordionContent({ className, children, ...props }: ComponentPropsWithoutRef<typeof Primitive.Content>) {
  return (
    <Primitive.Content className="overflow-hidden" {...props}>
      <div className={cn("pb-4 text-body text-ink-700", className)}>{children}</div>
    </Primitive.Content>
  );
}
