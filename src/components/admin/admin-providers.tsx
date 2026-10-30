"use client";

import type { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/toast";

export function AdminProviders({ children }: { children: ReactNode }) {
  return <ToastProvider dismissLabel="Dismiss">{children}</ToastProvider>;
}
