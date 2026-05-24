import Link from "next/link";
import Image from "next/image";
import { MessageSquare, LinkIcon, BarChart3, Pin } from "lucide-react";
import type { PostWithMeta } from "@/lib/types";
import { VoteControl } from "@/components/feed/vote-control";
import { SaveButton } from "@/components/feed/post-actions";
import { PostMenu } from "@/components/feed/post-menu";
import { Avatar } from "@/components/ui/avatar";
import { timeAgo } from "@/lib/utils";

export function PostCard({
  post,
  signedIn,
  currentUserId,
}: {
  post: PostWithMeta;
  signedIn: boolean;
  currentUserId?: string | null;
}) {
  const isOwner = !!currentUserId && currentUserId === post.author_id;
  const authorName = post.author.display_name || post.author.username;
  const excerpt = post.body_text.trim();

  return (
    <article className="flex gap-3 rounded-[var(--radius-xl)] border border-border bg-surface p-4 shadow-soft transition-colors hover:border-border-strong">
      <div className="pt-0.5">
        <VoteControl
          targetType="post"
          targetId={post.id}
          initialScore={post.score}
          initialVote={post.viewer_vote}
          signedIn={signedIn}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Avatar
            src={post.author.avatar_url}
            name={authorName}
            size={26}
          />
          <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 text-[12px] text-muted">
            <Link
              href={`/t/${post.topic.slug}`}
              className="font-semibold text-ink-soft hover:text-accent"
            >
              {post.topic.name}
            </Link>
            <span aria-hidden>·</span>
            <Link
              href={`/u/${post.author.username}`}
              className="hover:text-ink-soft"
            >
              {authorName}
            </Link>
            <span aria-hidden>·</span>
            <span>{timeAgo(post.created_at)}</span>
          </div>
          {post.is_pinned && (
            <span className="ml-auto flex items-center gap-1 text-[11px] font-medium text-accent">
              <Pin size={12} /> Pinned
            </span>
          )}
          {post.is_locked && (
            <span
              className={`${post.is_pinned ? "" : "ml-auto "}flex items-center gap-1 text-[11px] font-medium text-muted`}
            >
              Locked
            </span>
          )}
        </div>

        <Link href={`/post/${post.id}`} className="group mt-2 block">
          <h2 className="flex items-start gap-1.5 text-[17px] font-semibold leading-snug tracking-tight text-ink group-hover:text-accent">
            {post.post_type === "link" && (
              <LinkIcon size={15} className="mt-1 shrink-0 text-muted" />
            )}
            {post.post_type === "poll" && (
              <BarChart3 size={15} className="mt-1 shrink-0 text-muted" />
            )}
            {post.title}
          </h2>
          {excerpt && (
            <p className="mt-1 line-clamp-2 text-[14px] leading-relaxed text-ink-soft">
              {excerpt}
            </p>
          )}
          {post.post_type === "image" && post.image_url && (
            <div className="relative mt-2 aspect-[16/10] w-full overflow-hidden rounded-[var(--radius)] border border-border">
              <Image
                src={post.image_url}
                alt={post.title}
                fill
                sizes="(max-width: 768px) 100vw, 640px"
                className="object-cover"
              />
            </div>
          )}
          {post.post_type === "link" && post.link_url && (
            <span className="mt-1 block truncate text-[13px] text-accent">
              {post.link_url}
            </span>
          )}
        </Link>

        {post.tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={`/search?tag=${tag}`}
                className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-ink-soft hover:text-accent"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center gap-1">
          <Link
            href={`/post/${post.id}`}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[13px] font-medium text-muted hover:bg-surface-2 hover:text-ink"
          >
            <MessageSquare size={15} />
            {post.comment_count}
          </Link>
          <SaveButton
            targetType="post"
            targetId={post.id}
            initialSaved={post.viewer_saved}
            signedIn={signedIn}
          />
          <div className="ml-auto">
            <PostMenu
              postId={post.id}
              postPath={`/post/${post.id}`}
              isOwner={isOwner}
              signedIn={signedIn}
              initialTitle={post.title}
              initialBodyText={post.body_text}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
