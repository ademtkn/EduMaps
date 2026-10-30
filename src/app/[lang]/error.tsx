"use client";

import { TriangleAlert } from "lucide-react";
import { useDict } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const dict = useDict();
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <span className="mb-5 flex size-14 items-center justify-center rounded-full bg-danger-50 text-danger-600">
        <TriangleAlert className="size-7" />
      </span>
      <h1 className="text-h1 font-bold">{dict.errorPage.title}</h1>
      <p className="mt-3 max-w-md text-body text-ink-600">{dict.errorPage.description}</p>
      <Button className="mt-8" onClick={reset}>{dict.errorPage.retry}</Button>
    </div>
  );
}
