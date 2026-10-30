"use client";

import { Check, EyeOff, Flag, FlagOff, Pencil, Pin, PinOff, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  deleteCommentAdminAction, deletePostAdminAction, deleteReviewAdminAction, editReviewAction, moderateCommentAction,
  moderatePostAction, moderateReviewAction, resolveReportsAction,
} from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { ActionButton, NoteDialogButton } from "./action-buttons";

type Status = "pending" | "published" | "rejected" | "hidden";

export function ReviewActions({ review }: { review: { id: string; status: Status; is_flagged: boolean; title: string; body: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(review.title);
  const [body, setBody] = useState(review.body);
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      {review.status !== "published" ? (
        <ActionButton size="sm" variant="secondary" action={() => moderateReviewAction({ id: review.id, status: "published", note: "" })}><Check /> Approve</ActionButton>
      ) : null}
      {review.status !== "rejected" ? (
        <NoteDialogButton label={<><X /> Reject</>} title="Reject this review" action={(note) => moderateReviewAction({ id: review.id, status: "rejected", note })} />
      ) : null}
      {review.status === "published" ? (
        <NoteDialogButton label={<><EyeOff /> Hide</>} variant="outline" title="Hide this review" action={(note) => moderateReviewAction({ id: review.id, status: "hidden", note })} />
      ) : null}
      <Button size="sm" variant="outline" onClick={() => setEditing(true)}><Pencil /> Edit</Button>
      {review.is_flagged ? (
        <ActionButton size="sm" variant="outline" action={async () => {
          await resolveReportsAction("review", review.id);
          return moderateReviewAction({ id: review.id, flagged: false });
        }}><FlagOff /> Clear flag</ActionButton>
      ) : (
        <ActionButton size="sm" variant="outline" action={() => moderateReviewAction({ id: review.id, flagged: true })}><Flag /> Flag</ActionButton>
      )}
      <ActionButton size="sm" variant="ghost" className="text-danger-600 hover:bg-danger-50" confirm="Delete this review permanently?" action={() => deleteReviewAdminAction(review.id)}><Trash2 /> Delete</ActionButton>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent title="Edit review" description="Edits are visible to readers once the review is published.">
          <div className="space-y-4">
            <Field label="Headline" htmlFor={`t-${review.id}`}><Input id={`t-${review.id}`} value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} /></Field>
            <Field label="Review" htmlFor={`b-${review.id}`}><Textarea id={`b-${review.id}`} rows={8} value={body} maxLength={3000} onChange={(e) => setBody(e.target.value)} /></Field>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            <Button disabled={pending} onClick={() => start(async () => {
              const result = await editReviewAction({ id: review.id, title, body });
              if (!result.ok) return toast("error", result.error);
              setEditing(false);
              router.refresh();
            })}>Save changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function PostActions({ post }: { post: { id: string; status: Status; is_flagged: boolean; is_pinned: boolean } }) {
  return (
    <div className="flex flex-wrap gap-2">
      {post.status !== "published" ? (
        <ActionButton size="sm" variant="secondary" action={() => moderatePostAction({ id: post.id, status: "published", note: "" })}><Check /> Approve</ActionButton>
      ) : null}
      {post.status !== "rejected" ? (
        <NoteDialogButton label={<><X /> Reject</>} title="Reject this post" action={(note) => moderatePostAction({ id: post.id, status: "rejected", note })} />
      ) : null}
      {post.status === "published" ? (
        <>
          <NoteDialogButton label={<><EyeOff /> Hide</>} variant="outline" title="Hide this post" action={(note) => moderatePostAction({ id: post.id, status: "hidden", note })} />
          <ActionButton size="sm" variant="outline" action={() => moderatePostAction({ id: post.id, pinned: !post.is_pinned })}>
            {post.is_pinned ? <><PinOff /> Unpin</> : <><Pin /> Pin</>}
          </ActionButton>
        </>
      ) : null}
      {post.is_flagged ? (
        <ActionButton size="sm" variant="outline" action={async () => {
          await resolveReportsAction("post", post.id);
          return moderatePostAction({ id: post.id, flagged: false });
        }}><FlagOff /> Clear flag</ActionButton>
      ) : (
        <ActionButton size="sm" variant="outline" action={() => moderatePostAction({ id: post.id, flagged: true })}><Flag /> Flag</ActionButton>
      )}
      <ActionButton size="sm" variant="ghost" className="text-danger-600 hover:bg-danger-50" confirm="Delete this post and its replies permanently?" action={() => deletePostAdminAction(post.id)}><Trash2 /> Delete</ActionButton>
    </div>
  );
}

export function CommentActions({ comment }: { comment: { id: string; status: "published" | "hidden" | "pending" | "rejected"; is_flagged: boolean } }) {
  return (
    <div className="flex flex-wrap gap-2">
      <ActionButton size="sm" variant="outline" action={() => moderateCommentAction({ id: comment.id, status: comment.status === "hidden" ? "published" : "hidden" })}>
        <EyeOff /> {comment.status === "hidden" ? "Show" : "Hide"}
      </ActionButton>
      {comment.is_flagged ? (
        <ActionButton size="sm" variant="outline" action={async () => {
          await resolveReportsAction("comment", comment.id);
          return moderateCommentAction({ id: comment.id, flagged: false });
        }}><FlagOff /> Clear flag</ActionButton>
      ) : null}
      <ActionButton size="sm" variant="ghost" className="text-danger-600 hover:bg-danger-50" confirm="Delete this reply permanently?" action={() => deleteCommentAdminAction(comment.id)}><Trash2 /> Delete</ActionButton>
    </div>
  );
}
