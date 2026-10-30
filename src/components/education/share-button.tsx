"use client";

import { Share2 } from "lucide-react";
import { useDict } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function ShareButton({ title, className }: { title: string; className?: string }) {
  const dict = useDict();
  const { toast } = useToast();

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast("success", dict.common.linkCopied);
    } catch {
      /* user dismissed the share sheet */
    }
  }

  return (
    <Button variant="outline" onClick={share} className={className}>
      <Share2 /> {dict.common.share}
    </Button>
  );
}
