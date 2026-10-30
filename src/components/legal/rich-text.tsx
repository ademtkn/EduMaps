import type { ReactNode } from "react";
import { LLink } from "@/components/ui/localized-link";

export type RichVars = Record<string, string | number>;
export type RichLinks = Record<string, { href: string; label: string }>;

/** Fills {placeholders} in legal copy; placeholders listed in `links` become links to other legal pages. */
export function RichText({ text, vars, links = {} }: { text: string; vars: RichVars; links?: RichLinks }) {
  const nodes: ReactNode[] = text.split(/(\{\w+\})/g).map((part, i) => {
    const key = /^\{(\w+)\}$/.exec(part)?.[1];
    if (!key) return part;
    const link = links[key];
    if (link) {
      return <LLink key={i} href={link.href} className="font-medium text-brand-700 underline underline-offset-2 hover:text-brand-900">{link.label}</LLink>;
    }
    if (key === "email") return <a key={i} href={`mailto:${vars.email}`} className="font-medium text-brand-700 underline underline-offset-2 hover:text-brand-900">{vars.email}</a>;
    return key in vars ? String(vars[key]) : part;
  });
  return <>{nodes}</>;
}
