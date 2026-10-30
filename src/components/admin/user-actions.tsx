"use client";

import { Ban, ShieldCheck } from "lucide-react";
import { setUserBanAction, setUserRoleAction } from "@/lib/actions/admin";
import { Select } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ActionButton, NoteDialogButton } from "./action-buttons";

export function UserActions({ user, isSelf }: { user: { id: string; role: "user" | "moderator" | "admin"; is_banned: boolean }; isSelf: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  if (isSelf) return <span className="text-caption text-ink-500">You</span>;

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Select
        aria-label="Role"
        className="h-9 w-32"
        value={user.role}
        disabled={pending}
        onChange={(e) =>
          start(async () => {
            const r = await setUserRoleAction(user.id, e.target.value as typeof user.role);
            if (!r.ok) toast("error", r.error);
            router.refresh();
          })
        }
      >
        <option value="user">Member</option>
        <option value="moderator">Moderator</option>
        <option value="admin">Admin</option>
      </Select>
      {user.is_banned ? (
        <ActionButton size="sm" variant="outline" action={() => setUserBanAction(user.id, false)}><ShieldCheck /> Unban</ActionButton>
      ) : (
        <NoteDialogButton label={<><Ban /> Ban</>} title="Ban this user" placeholder="Reason (internal)" action={(reason) => setUserBanAction(user.id, true, reason)} />
      )}
    </div>
  );
}
