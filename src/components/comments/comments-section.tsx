"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { CommentComposer } from "@/components/comments/comment-composer";
import { CommentItem } from "@/components/comments/comment-item";
import { createComment } from "@/lib/actions/comment";
import type { CommentWithMeta } from "@/lib/types";

export type CommentNode = CommentWithMeta & { children: CommentNode[] };

function buildTree(comments: CommentWithMeta[]): CommentNode[] {
  const byId = new Map<string, CommentNode>();
  comments.forEach((c) => byId.set(c.id, { ...c, children: [] }));
  const roots: CommentNode[] = [];
  byId.forEach((node) => {
    if (node.parent_id && byId.has(node.parent_id)) {
      byId.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

export function CommentsSection({
  postId,
  comments,
  signedIn,
  currentUserId,
  isLocked,
  isStaff,
}: {
  postId: string;
  comments: CommentWithMeta[];
  signedIn: boolean;
  currentUserId: string | null;
  isLocked: boolean;
  isStaff: boolean;
}) {
  const router = useRouter();
  const tree = buildTree(comments);

  return (
    <section className="rounded-[var(--radius-xl)] border border-border bg-surface p-4 shadow-soft sm:p-5">
      <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
        <MessageSquare size={17} />
        {comments.length} {comments.length === 1 ? "comment" : "comments"}
      </h2>

      <div className="mt-4">
        {isLocked ? (
          <p className="rounded-[var(--radius)] bg-surface-2 px-3 py-2.5 text-[13px] text-muted">
            This post is locked. New comments are turned off.
          </p>
        ) : signedIn ? (
          <CommentComposer
            placeholder="Share a supportive reply…"
            submitLabel="Comment"
            onSubmit={async (text) => {
              const res = await createComment(postId, null, text);
              if (res.ok) router.refresh();
              return res;
            }}
          />
        ) : (
          <p className="rounded-[var(--radius)] bg-surface-2 px-3 py-2.5 text-[13px] text-ink-soft">
            <Link href="/login" className="font-semibold text-accent">
              Sign in
            </Link>{" "}
            to join the conversation.
          </p>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-4">
        {tree.length === 0 ? (
          <p className="py-4 text-center text-[13px] text-muted">
            No comments yet — be the first to reply.
          </p>
        ) : (
          tree.map((node) => (
            <CommentItem
              key={node.id}
              node={node}
              postId={postId}
              signedIn={signedIn}
              currentUserId={currentUserId}
              isLocked={isLocked}
              isStaff={isStaff}
            />
          ))
        )}
      </div>
    </section>
  );
}
