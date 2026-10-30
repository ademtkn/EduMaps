"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { localizedPath } from "@/lib/i18n/config";
import { useLang } from "@/components/i18n-provider";

type Props = Omit<ComponentProps<typeof Link>, "href"> & { href: string };

/** next/link that prefixes the current language. External and hash links pass through untouched. */
export function LLink({ href, ...props }: Props) {
  const lang = useLang();
  const isExternal = /^(https?:|mailto:|tel:|#)/.test(href);
  return <Link href={isExternal ? href : localizedPath(lang, href)} {...props} />;
}
