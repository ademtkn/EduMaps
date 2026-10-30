"use client";

import * as Primitive from "@radix-ui/react-dropdown-menu";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export const Dropdown = Primitive.Root;
export const DropdownTrigger = Primitive.Trigger;

export function DropdownContent({ className, sideOffset = 8, ...props }: ComponentPropsWithoutRef<typeof Primitive.Content>) {
  return (
    <Primitive.Portal>
      <Primitive.Content
        sideOffset={sideOffset}
        align="end"
        className={cn("z-50 min-w-52 rounded-card border border-ink-200 bg-white p-1.5 shadow-lift", className)}
        {...props}
      />
    </Primitive.Portal>
  );
}

export function DropdownItem({ className, ...props }: ComponentPropsWithoutRef<typeof Primitive.Item>) {
  return (
    <Primitive.Item
      className={cn(
        "flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-3 py-2.5 text-small text-ink-800 outline-none data-[highlighted]:bg-ink-100 [&_svg]:size-4 [&_svg]:text-ink-500",
        className
      )}
      {...props}
    />
  );
}

export const DropdownSeparator = ({ className }: { className?: string }) => (
  <Primitive.Separator className={cn("my-1.5 h-px bg-ink-200", className)} />
);
export const DropdownLabel = Primitive.Label;
