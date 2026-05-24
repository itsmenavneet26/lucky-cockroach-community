"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Reply, Pencil, Trash2, Shield, RotateCcw } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { VoteControl } from "@/components/feed/vote-control";
import { CommentComposer } from "@/components/comments/comment-composer";
import {
  createComment,
  editComment,
  deleteComment,
} from "@/lib/actions/comment";
import { setCommentRemoved } from "@/lib/actions/moderation";
import { ReportDialog } from "@/components/moderation/report-dialog";
import { useToast } from "@/components/ui/toast";
import { timeAgo } from "@/lib/utils";
import type { CommentNode } from "@/components/comments/comments-section";

export function CommentItem({
  node,
  postId,
  signedIn,
  currentUserId,
  isLocked,
  isStaff,
}: {
  node: CommentNode;
  postId: string;
  signedIn: boolean;
  currentUserId: string | null;
  isLocked: boolean;
  isStaff: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const isOwn = currentUserId === node.author_id;
  const name = node.author.display_name || node.author.username;

  return (
    <div>
      <div className="flex gap-2.5">
        <Avatar src={node.author.avatar_url} name={name} size={30} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[12px] text-muted">
            <Link
              href={`/u/${node.author.username}`}
              className="font-semibold text-ink hover:text-accent"
            >
              {name}
            </Link>
            <span aria-hidden>·</span>
            <span>{timeAgo(node.created_at)}</span>
            {node.edited_at && <span>· edited</span>}
          </div>

          {node.is_removed ? (
            <div className="mt-1 flex items-center gap-2">
              <p className="text-[14px] italic text-muted">
                [comment removed]
              </p>
              {isStaff && (
                <button
                  onClick={async () => {
                    const res = await setCommentRemoved(node.id, postId, false);
                    if (res.ok) router.refresh();
                    else toast.error(res.error || "Couldn't restore.");
                  }}
                  className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-accent hover:bg-surface-2"
                >
                  <RotateCcw size={11} /> Restore
                </button>
              )}
            </div>
          ) : editing ? (
            <div className="mt-1.5">
              <CommentComposer
                initialValue={node.body_text}
                submitLabel="Save"
                autoFocus
                onCancel={() => setEditing(false)}
                onSubmit={async (text) => {
                  const res = await editComment(node.id, postId, text);
                  if (res.ok) router.refresh();
                  return res;
                }}
              />
            </div>
          ) : (
            <p className="mt-1 whitespace-pre-line text-[14px] leading-relaxed text-ink">
              {node.body_text}
            </p>
          )}

          {!node.is_removed && !editing && (
            <div className="mt-1.5 flex items-center gap-1">
              <VoteControl
                targetType="comment"
                targetId={node.id}
                initialScore={node.score}
                initialVote={node.viewer_vote}
                signedIn={signedIn}
                layout="horizontal"
              />
              {signedIn && !isLocked && (
                <button
                  onClick={() => setReplying((v) => !v)}
                  className="flex items-center gap-1 rounded-full px-2 py-1 text-[12px] font-medium text-muted hover:bg-surface-2 hover:text-ink"
                >
                  <Reply size={13} /> Reply
                </button>
              )}
              {isOwn && (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1 rounded-full px-2 py-1 text-[12px] font-medium text-muted hover:bg-surface-2 hover:text-ink"
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm("Delete this comment?")) return;
                      const res = await deleteComment(node.id, postId);
                      if (res.ok) {
                        toast.success("Comment deleted.");
                        router.refresh();
                      } else {
                        toast.error(res.error || "Couldn't delete.");
                      }
                    }}
                    className="flex items-center gap-1 rounded-full px-2 py-1 text-[12px] font-medium text-muted hover:bg-surface-2 hover:text-danger"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </>
              )}
              {!isOwn && (
                <ReportDialog
                  targetType="comment"
                  targetId={node.id}
                  signedIn={signedIn}
                />
              )}
              {isStaff && !isOwn && (
                <button
                  onClick={async () => {
                    const res = await setCommentRemoved(node.id, postId, true);
                    if (res.ok) {
                      toast.success("Comment removed.");
                      router.refresh();
                    } else {
                      toast.error(res.error || "Couldn't remove.");
                    }
                  }}
                  className="flex items-center gap-1 rounded-full px-2 py-1 text-[12px] font-medium text-muted hover:bg-surface-2 hover:text-danger"
                >
                  <Shield size={13} /> Remove
                </button>
              )}
            </div>
          )}

          {replying && (
            <div className="mt-2">
              <CommentComposer
                placeholder={`Reply to ${name}…`}
                submitLabel="Reply"
                autoFocus
                onCancel={() => setReplying(false)}
                onSubmit={async (text) => {
                  const res = await createComment(postId, node.id, text);
                  if (res.ok) router.refresh();
                  return res;
                }}
              />
            </div>
          )}
        </div>
      </div>

      {node.children.length > 0 && (
        <div className="mt-3 flex flex-col gap-3 border-l border-border pl-3 sm:pl-5">
          {node.children.map((child) => (
            <CommentItem
              key={child.id}
              node={child}
              postId={postId}
              signedIn={signedIn}
              currentUserId={currentUserId}
              isLocked={isLocked}
              isStaff={isStaff}
            />
          ))}
        </div>
      )}
    </div>
  );
}
