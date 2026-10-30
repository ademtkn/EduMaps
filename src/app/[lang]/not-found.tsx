"use client";

import { SearchX } from "lucide-react";
import { useDict } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { LLink } from "@/components/ui/localized-link";

export default function NotFound() {
  const dict = useDict();
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <span className="mb-5 flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
        <SearchX className="size-7" />
      </span>
      <h1 className="text-h1 font-bold">{dict.notFound.title}</h1>
      <p className="mt-3 max-w-md text-body text-ink-600">{dict.notFound.description}</p>
      <Button asChild className="mt-8">
        <LLink href="/">{dict.notFound.cta}</LLink>
      </Button>
    </div>
  );
}
