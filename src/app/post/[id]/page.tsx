import Link from "next/link";
import { notFound } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import { Lock, Pin, MessageSquare, ExternalLink } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { RightSidebar } from "@/components/layout/right-sidebar";
import { VoteControl } from "@/components/feed/vote-control";
import { SaveButton } from "@/components/feed/post-actions";
import { PostMenu } from "@/components/feed/post-menu";
import { PollDisplay } from "@/components/feed/poll-display";
import { RichText } from "@/components/editor/rich-text";
import { Avatar } from "@/components/ui/avatar";
import { CommentsSection } from "@/components/comments/comments-section";
import { PostModBar } from "@/components/moderation/post-mod-bar";
import { getPost, getPoll, getComments, requireStaff } from "@/lib/queries";
import { getProfile } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { after } from "next/server";
import { timeAgo } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) return { title: "Post not found", robots: { index: false } };
  const description =
    (post.body_text || "").slice(0, 160).trim() ||
    `${post.title} — a discussion in ${post.topic.name} on Lucky Cockroach Community.`;
  const url = `/post/${post.id}`;
  const authorName = post.author.display_name || post.author.username;
  return {
    title: post.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: post.title,
      description,
      url,
      publishedTime: post.created_at,
      authors: [authorName],
      tags: [post.topic.name],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
    },
    robots: post.is_removed
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [post, profile, isStaff] = await Promise.all([
    getPost(id),
    getProfile(),
    requireStaff().then((r) => !!r),
  ]);
  if (!post) notFound();
  if (post.is_removed && !isStaff && profile?.id !== post.author_id) notFound();
  const authorName = post.author.display_name || post.author.username;

  const [poll, comments] = await Promise.all([
    post.post_type === "poll" ? getPoll(post.id) : Promise.resolve(null),
    getComments(post.id),
  ]);

  // Count the view after the response is sent so it doesn't delay rendering.
  after(async () => {
    await createServiceClient().rpc("increment_post_view", { p_id: post.id });
  });

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    "@id": `${siteUrl}/post/${post.id}`,
    headline: post.title,
    articleBody: post.body_text || undefined,
    url: `${siteUrl}/post/${post.id}`,
    datePublished: post.created_at,
    author: {
      "@type": "Person",
      name: authorName,
      url: `${siteUrl}/u/${post.author.username}`,
    },
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/LikeAction",
        userInteractionCount: Math.max(post.score, 0),
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/CommentAction",
        userInteractionCount: comments.length,
      },
    ],
    about: {
      "@type": "Thing",
      name: post.topic.name,
      url: `${siteUrl}/t/${post.topic.slug}`,
    },
  };

  return (
    <AppShell rightSidebar={<RightSidebar />}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="flex flex-col gap-4">
        {isStaff && (
          <PostModBar
            postId={post.id}
            isRemoved={post.is_removed}
            isLocked={post.is_locked}
            isPinned={post.is_pinned}
          />
        )}
        <article className="rounded-[var(--radius-xl)] border border-border bg-surface p-4 shadow-soft sm:p-5">
          <div className="flex gap-3">
            <div className="pt-0.5">
              <VoteControl
                targetType="post"
                targetId={post.id}
                initialScore={post.score}
                initialVote={post.viewer_vote}
                signedIn={!!profile}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Avatar src={post.author.avatar_url} name={authorName} size={28} />
                <div className="flex flex-wrap items-center gap-x-1.5 text-[12px] text-muted">
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
                  {post.edited_at && <span>· edited</span>}
                </div>
                {post.is_pinned && (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-accent">
                    <Pin size={12} /> Pinned
                  </span>
                )}
                {post.is_locked && (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-muted">
                    <Lock size={12} /> Locked
                  </span>
                )}
              </div>

              <h1 className="mt-2.5 text-[24px] font-semibold leading-tight tracking-tight text-ink">
                {post.title}
              </h1>

              {post.post_type === "text" && (
                <div className="mt-3 text-[15px] text-ink">
                  <RichText content={(post.body as JSONContent) ?? {}} />
                </div>
              )}

              {post.post_type === "image" && post.image_url && (
                <div className="mt-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.image_url}
                    alt={post.title}
                    className="w-full rounded-[var(--radius)] border border-border object-contain"
                  />
                  {post.body_text && (
                    <p className="mt-2 text-[14px] text-ink-soft">
                      {post.body_text}
                    </p>
                  )}
                </div>
              )}

              {post.post_type === "link" && post.link_url && (
                <a
                  href={post.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center gap-2 rounded-[var(--radius)] border border-border bg-surface-2 px-3 py-2.5 text-[14px] font-medium text-accent hover:border-accent"
                >
                  <ExternalLink size={16} />
                  <span className="truncate">{post.link_url}</span>
                </a>
              )}

              {post.post_type === "poll" && poll && (
                <>
                  {post.body_text && (
                    <p className="mt-3 text-[15px] text-ink">{post.body_text}</p>
                  )}
                  <PollDisplay
                    postId={post.id}
                    options={poll.options}
                    viewerOptionId={poll.viewerOptionId}
                    signedIn={!!profile}
                  />
                </>
              )}

              {post.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
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

              <div className="mt-3 flex items-center gap-1 border-t border-border pt-3 text-[13px] text-muted">
                <span className="flex items-center gap-1.5 px-2.5 py-1.5 font-medium">
                  <MessageSquare size={15} />
                  {post.comment_count}{" "}
                  {post.comment_count === 1 ? "comment" : "comments"}
                </span>
                <SaveButton
                  targetType="post"
                  targetId={post.id}
                  initialSaved={post.viewer_saved}
                  signedIn={!!profile}
                />
                <PostMenu
                  postId={post.id}
                  postPath={`/post/${post.id}`}
                  isOwner={profile?.id === post.author_id}
                  signedIn={!!profile}
                  initialTitle={post.title}
                  initialBodyText={post.body_text}
                />
                <span className="ml-auto text-[12px] text-muted">
                  {post.view_count} views
                </span>
              </div>
            </div>
          </div>
        </article>

        <CommentsSection
          postId={post.id}
          comments={comments}
          signedIn={!!profile}
          currentUserId={profile?.id ?? null}
          isLocked={post.is_locked}
          isStaff={isStaff}
        />
      </div>
    </AppShell>
  );
}
