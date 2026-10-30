"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deletePostAction, deleteReviewAction } from "@/lib/actions/content";
import { errorText } from "@/lib/form-errors";
import { useDict } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function DeleteContentButton({ kind, id }: { kind: "review" | "post"; id: string }) {
  const dict = useDict();
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={busy}
      className="text-danger-600 hover:bg-danger-50"
      onClick={async () => {
        if (!window.confirm(dict.dashboard.deleteConfirm)) return;
        setBusy(true);
        const result = await (kind === "review" ? deleteReviewAction(id) : deletePostAction(id));
        setBusy(false);
        if (!result.ok) return toast("error", errorText(dict, result.error) ?? dict.errors.unknown);
        toast("success", dict.dashboard.deleted);
        router.refresh();
      }}
    >
      <Trash2 /> {dict.common.delete}
    </Button>
  );
}
