"use client";

import * as Primitive from "@radix-ui/react-tabs";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export const Tabs = Primitive.Root;
export const TabsContent = Primitive.Content;

export function TabsList({ className, ...props }: ComponentPropsWithoutRef<typeof Primitive.List>) {
  return (
    <Primitive.List
      className={cn("scrollbar-none flex gap-1 overflow-x-auto rounded-control bg-ink-100 p-1", className)}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: ComponentPropsWithoutRef<typeof Primitive.Trigger>) {
  return (
    <Primitive.Trigger
      className={cn(
        "whitespace-nowrap rounded-lg px-3.5 py-2 text-small font-semibold text-ink-600 transition-colors hover:text-ink-900 data-[state=active]:bg-white data-[state=active]:text-brand-800 data-[state=active]:shadow-sm",
        className
      )}
      {...props}
    />
  );
}
