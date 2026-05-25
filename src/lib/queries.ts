import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import type {
  CommentWithMeta,
  FeedSort,
  PostWithMeta,
  Profile,
  SiteSettings,
  Topic,
} from "@/lib/types";

/** Returns the caller's role, or null if signed out. Cached per request. */
const callerRole = cache(async (): Promise<string | null> => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (error) {
    console.error("[queries] callerRole:", error.message);
    return null;
  }
  return data?.role ?? null;
});

export async function requireStaff(): Promise<"moderator" | "admin" | null> {
  const role = await callerRole();
  return role === "moderator" || role === "admin" ? role : null;
}

export async function requireAdmin(): Promise<boolean> {
  return (await callerRole()) === "admin";
}

const DEFAULT_SETTINGS: SiteSettings = {
  id: 1,
  site_name: "Lucky Cockroach Community",
  tagline: "Share what you're going through.",
  registration_open: true,
  feature_flags: { polls: true, images: true, links: true },
  rate_limits: { post_per_hour: 10, comment_per_hour: 60 },
  crisis_resources: [],
  announcement: { enabled: false, text: "", href: "", image: "" },
  home_hero: {
    heading: "Join the movement. Stand with people who understand.",
    text: "Real stories. Real support. Real impact.",
    cta_label: "Learn more",
    cta_href: "/about",
    image: "",
  },
  volunteer_hero: {
    heading: "Volunteer with the Lucky Cockroach movement",
    text: "None of it happens without volunteers.",
    image: "",
  },
  default_feed_sort: "hot",
};

/**
 * Site-wide settings — admin-editable. Cached cross-request via
 * `unstable_cache` (tag: "settings") so every public page reuses one read.
 * Admin mutations call `revalidateTag("settings")` to flush.
 * Wrapped again in React `cache()` so multiple components in one render
 * dedup to a single hit.
 */
export const getSettings = cache(
  unstable_cache(
    async (): Promise<SiteSettings> => {
      const service = createServiceClient();
      const { data } = await service
        .from("site_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      return data
        ? ({ ...DEFAULT_SETTINGS, ...data } as SiteSettings)
        : DEFAULT_SETTINGS;
    },
    ["site-settings"],
    { tags: ["settings"], revalidate: 300 },
  ),
);

const POST_SELECT = `
  id, author_id, topic_id, title, body, body_text, post_type, link_url, image_url,
  score, comment_count, view_count, hot_score, is_pinned, is_locked,
  is_removed, created_at, edited_at,
  author:profiles!posts_author_id_fkey (id, username, display_name, avatar_url),
  topic:topics!posts_topic_id_fkey (id, slug, name),
  post_tags ( tags ( slug ) )
`;

type RawPost = Record<string, unknown> & {
  id: string;
  author: PostWithMeta["author"];
  topic: PostWithMeta["topic"];
  post_tags: { tags: { slug: string } | null }[] | null;
};

/** Attach the current viewer's vote + save state to a set of posts. */
async function decoratePosts(rows: RawPost[]): Promise<PostWithMeta[]> {
  const user = await getUser();
  const votes = new Map<string, -1 | 1>();
  const saved = new Set<string>();

  if (user && rows.length > 0) {
    const supabase = await createClient();
    const ids = rows.map((r) => r.id);
    const [{ data: voteRows }, { data: saveRows }] = await Promise.all([
      supabase
        .from("votes")
        .select("target_id, value")
        .eq("user_id", user.id)
        .eq("target_type", "post")
        .in("target_id", ids),
      supabase
        .from("saves")
        .select("target_id")
        .eq("user_id", user.id)
        .eq("target_type", "post")
        .in("target_id", ids),
    ]);
    voteRows?.forEach((v) => votes.set(v.target_id, v.value as -1 | 1));
    saveRows?.forEach((s) => saved.add(s.target_id));
  }

  return rows.map((r) => ({
    ...(r as unknown as PostWithMeta),
    tags: (r.post_tags ?? [])
      .map((pt) => pt.tags?.slug)
      .filter((s): s is string => Boolean(s)),
    viewer_vote: votes.get(r.id) ?? 0,
    viewer_saved: saved.has(r.id),
  }));
}

export type FeedOptions = {
  sort?: FeedSort;
  topicId?: string;
  authorId?: string;
  limit?: number;
  /** Offset pagination — fine for page 1, slow past page ~50 at scale. */
  offset?: number;
  /** Opaque cursor returned by a previous page. Preferred for deep paging. */
  cursor?: string;
};

/** Encode/decode the keyset cursor used by feed/comments/notifications. */
type Keyset = { ts: string; id: string };
export function encodeCursor(k: Keyset): string {
  return Buffer.from(JSON.stringify(k), "utf8").toString("base64url");
}
export function decodeCursor(raw: string | undefined | null): Keyset | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (typeof obj?.ts === "string" && typeof obj?.id === "string") {
      return obj as Keyset;
    }
  } catch {
    /* fall through */
  }
  return null;
}

export async function getFeedPosts(
  opts: FeedOptions = {},
): Promise<PostWithMeta[]> {
  const {
    sort = "hot",
    topicId,
    authorId,
    limit = 20,
    offset = 0,
    cursor,
  } = opts;
  const supabase = await createClient();

  let query = supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("is_removed", false);

  if (topicId) query = query.eq("topic_id", topicId);
  if (authorId) query = query.eq("author_id", authorId);

  // Keyset pagination on the "new" sort — the only ordering with a
  // single monotonic key (created_at). The other sorts still use offset
  // because their secondary signals (hot/score) change too quickly to
  // be safe as cursor keys.
  const decoded = decodeCursor(cursor);
  if (sort === "new") {
    if (decoded) {
      query = query.or(
        `created_at.lt.${decoded.ts},and(created_at.eq.${decoded.ts},id.lt.${decoded.id})`,
      );
    }
    query = query.order("created_at", { ascending: false }).order("id", { ascending: false });
  } else if (sort === "top") query = query.order("score", { ascending: false });
  else if (sort === "rising") {
    const since = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
    query = query.gte("created_at", since).order("score", { ascending: false });
  } else query = query.order("hot_score", { ascending: false });

  query = query.order("is_pinned", { ascending: false });
  if (sort === "new" && decoded) {
    query = query.limit(limit);
  } else {
    query = query.range(offset, offset + limit - 1);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return decoratePosts(data as unknown as RawPost[]);
}

/** Feed of posts from topics the viewer has joined. */
export async function getFollowingFeed(
  limit = 20,
  offset = 0,
): Promise<PostWithMeta[]> {
  const user = await getUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data: memberships } = await supabase
    .from("topic_members")
    .select("topic_id")
    .eq("user_id", user.id);
  const topicIds = (memberships ?? []).map((m) => m.topic_id);
  if (topicIds.length === 0) return [];

  const { data } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("is_removed", false)
    .in("topic_id", topicIds)
    .order("hot_score", { ascending: false })
    .range(offset, offset + limit - 1);
  if (!data) return [];
  return decoratePosts(data as unknown as RawPost[]);
}

export async function getPost(id: string): Promise<PostWithMeta | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const [decorated] = await decoratePosts([data as unknown as RawPost]);
  return decorated ?? null;
}

export async function getTopic(slug: string): Promise<Topic | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("topics")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return (data as Topic) ?? null;
}

/**
 * Active topics — the same list on every page. Cached cross-request with
 * tag `topics`; admin topic-management actions should call
 * `revalidateTag("topics")` to flush.
 */
export const getTopics = unstable_cache(
  async (): Promise<Topic[]> => {
    const service = createServiceClient();
    const { data } = await service
      .from("topics")
      .select("*")
      .eq("is_archived", false)
      .order("sort_order");
    return (data as Topic[]) ?? [];
  },
  ["topics-active"],
  { tags: ["topics"], revalidate: 300 },
);

/** Full-text search across posts. */
export async function searchPosts(query: string): Promise<PostWithMeta[]> {
  const q = query.trim();
  if (!q) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("is_removed", false)
    .textSearch("search_vector", q, { type: "websearch" })
    .order("score", { ascending: false })
    .limit(30);
  if (!data) return [];
  return decoratePosts(data as unknown as RawPost[]);
}

/** Posts carrying a given tag slug. */
export async function postsByTag(tagSlug: string): Promise<PostWithMeta[]> {
  const supabase = await createClient();
  const { data: tag } = await supabase
    .from("tags")
    .select("id")
    .eq("slug", tagSlug)
    .maybeSingle();
  if (!tag) return [];
  const { data: links } = await supabase
    .from("post_tags")
    .select("post_id")
    .eq("tag_id", tag.id);
  const ids = (links ?? []).map((l) => l.post_id);
  if (ids.length === 0) return [];
  const { data } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("is_removed", false)
    .in("id", ids)
    .order("hot_score", { ascending: false });
  if (!data) return [];
  return decoratePosts(data as unknown as RawPost[]);
}

export async function searchTopics(query: string): Promise<Topic[]> {
  const q = query.trim();
  if (!q) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("topics")
    .select("*")
    .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
    .eq("is_archived", false)
    .limit(8);
  return (data as Topic[]) ?? [];
}

export async function searchPeople(query: string): Promise<Profile[]> {
  const q = query.trim();
  if (!q) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
    .limit(10);
  return (data as Profile[]) ?? [];
}

export async function getProfileByUsername(
  username: string,
): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle();
  return (data as Profile) ?? null;
}

export type PollOption = {
  id: string;
  post_id: string;
  label: string;
  vote_count: number;
  sort_order: number;
};

export async function getPoll(postId: string): Promise<{
  options: PollOption[];
  viewerOptionId: string | null;
}> {
  const supabase = await createClient();
  const { data: options } = await supabase
    .from("poll_options")
    .select("*")
    .eq("post_id", postId)
    .order("sort_order");

  let viewerOptionId: string | null = null;
  const user = await getUser();
  if (user) {
    const { data } = await supabase
      .from("poll_votes")
      .select("poll_option_id")
      .eq("user_id", user.id)
      .eq("post_id", postId)
      .maybeSingle();
    viewerOptionId = data?.poll_option_id ?? null;
  }
  return { options: (options as PollOption[]) ?? [], viewerOptionId };
}

export type UserBadge = {
  awarded_at: string;
  badge: { slug: string; name: string; description: string | null; icon: string | null };
};

export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_badges")
    .select("awarded_at, badge:badges (slug, name, description, icon)")
    .eq("user_id", userId)
    .order("awarded_at", { ascending: false });
  return (data as unknown as UserBadge[]) ?? [];
}

export async function getFollowState(profileId: string): Promise<{
  followers: number;
  following: number;
  viewerFollows: boolean;
}> {
  const supabase = await createClient();
  const viewer = await getUser();
  const [{ count: followers }, { count: following }] = await Promise.all([
    supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("target_type", "user")
      .eq("target_id", profileId),
    supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("follower_id", profileId),
  ]);
  let viewerFollows = false;
  if (viewer && viewer.id !== profileId) {
    const { data } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", viewer.id)
      .eq("target_type", "user")
      .eq("target_id", profileId)
      .maybeSingle();
    viewerFollows = !!data;
  }
  return { followers: followers ?? 0, following: following ?? 0, viewerFollows };
}

export async function getSavedPosts(): Promise<PostWithMeta[]> {
  const user = await getUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data: saves } = await supabase
    .from("saves")
    .select("target_id, created_at")
    .eq("user_id", user.id)
    .eq("target_type", "post")
    .order("created_at", { ascending: false });
  const ids = (saves ?? []).map((s) => s.target_id);
  if (ids.length === 0) return [];
  const { data } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .in("id", ids)
    .eq("is_removed", false);
  if (!data) return [];
  const decorated = await decoratePosts(data as unknown as RawPost[]);
  // preserve save order
  return ids
    .map((id) => decorated.find((p) => p.id === id))
    .filter((p): p is PostWithMeta => Boolean(p));
}

/**
 * Top community members by karma. Cached for 60s with tag `leaderboard`;
 * karma trigger (or admin actions) can `revalidateTag("leaderboard")` for
 * fresh state. Uses service client because the leaderboard is public.
 */
export const getLeaderboard = unstable_cache(
  async (limit = 25): Promise<Profile[]> => {
    const service = createServiceClient();
    const { data } = await service
      .from("profiles")
      .select("*")
      .eq("is_banned", false)
      .order("karma", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(limit);
    return (data as Profile[]) ?? [];
  },
  ["leaderboard"],
  { tags: ["leaderboard"], revalidate: 60 },
);

const COMMENT_SELECT = `
  id, post_id, author_id, parent_id, path, depth, body, body_text,
  score, is_removed, edited_at, created_at,
  author:profiles!comments_author_id_fkey (id, username, display_name, avatar_url)
`;

export type NotificationView = {
  id: string;
  type: string;
  is_read: boolean;
  created_at: string;
  actorName: string;
  actorUsername: string | null;
  actorAvatar: string | null;
  text: string;
  href: string;
};

const NOTIF_TEXT: Record<string, string> = {
  reply: "replied to you",
  mention: "mentioned you",
  follow: "started following you",
  vote_milestone: "your post is gaining traction",
  mod_action: "a moderator acted on your content",
};

export async function getNotifications(): Promise<NotificationView[]> {
  const user = await getUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select(
      `id, type, target_type, target_id, meta, is_read, created_at,
       actor:profiles!notifications_actor_id_fkey (username, display_name, avatar_url)`,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(40);
  if (!data) return [];

  const commentIds = data
    .filter((n) => n.target_type === "comment" && n.target_id)
    .map((n) => n.target_id as string);
  const postByComment = new Map<string, string>();
  if (commentIds.length > 0) {
    const { data: cs } = await supabase
      .from("comments")
      .select("id, post_id")
      .in("id", commentIds);
    cs?.forEach((c) => postByComment.set(c.id, c.post_id));
  }

  return data.map((n) => {
    const actor = n.actor as unknown as {
      username: string;
      display_name: string | null;
      avatar_url: string | null;
    } | null;
    let href = "/notifications";
    if (n.type === "follow" && actor) href = `/u/${actor.username}`;
    else if (n.type === "vote_milestone" && n.target_id)
      href = `/post/${n.target_id}`;
    else if (n.target_type === "comment" && n.target_id) {
      const postId = postByComment.get(n.target_id as string);
      if (postId) href = `/post/${postId}`;
    } else if (n.target_type === "post" && n.target_id)
      href = `/post/${n.target_id}`;

    return {
      id: n.id,
      type: n.type,
      is_read: n.is_read,
      created_at: n.created_at,
      actorName: actor?.display_name || actor?.username || "Someone",
      actorUsername: actor?.username ?? null,
      actorAvatar: actor?.avatar_url ?? null,
      text: NOTIF_TEXT[n.type] ?? "sent you a notification",
      href,
    };
  });
}

export type UserComment = {
  id: string;
  body_text: string;
  score: number;
  created_at: string;
  post: { id: string; title: string } | null;
};

export async function getUserComments(
  userId: string,
  limit = 30,
): Promise<UserComment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("comments")
    .select("id, body_text, score, created_at, post:posts!comments_post_id_fkey (id, title)")
    .eq("author_id", userId)
    .eq("is_removed", false)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as unknown as UserComment[]) ?? [];
}

export async function getComments(postId: string): Promise<CommentWithMeta[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("comments")
    .select(COMMENT_SELECT)
    .eq("post_id", postId)
    .order("path", { ascending: true });
  if (!data) return [];

  const user = await getUser();
  const votes = new Map<string, -1 | 1>();
  if (user && data.length > 0) {
    const { data: voteRows } = await supabase
      .from("votes")
      .select("target_id, value")
      .eq("user_id", user.id)
      .eq("target_type", "comment")
      .in(
        "target_id",
        data.map((c) => c.id),
      );
    voteRows?.forEach((v) => votes.set(v.target_id, v.value as -1 | 1));
  }

  return data.map((c) => ({
    ...(c as unknown as CommentWithMeta),
    viewer_vote: votes.get(c.id) ?? 0,
  }));
}

// ── Moderation queue ─────────────────────────────────────────
export type ModReport = {
  id: string;
  reason: string;
  details: string | null;
  created_at: string;
  reporterName: string;
  targetType: "post" | "comment";
  targetId: string;
  targetExcerpt: string;
  targetHref: string;
  targetRemoved: boolean;
  postId: string | null;
};

export async function getModReports(): Promise<ModReport[]> {
  if (!(await requireStaff())) return [];
  const service = createServiceClient();
  const { data: reports } = await service
    .from("reports")
    .select(
      "id, reason, details, created_at, target_type, target_id, reporter:profiles!reports_reporter_id_fkey (username, display_name)",
    )
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(60);
  if (!reports || reports.length === 0) return [];

  const postIds = reports.filter((r) => r.target_type === "post").map((r) => r.target_id);
  const commentIds = reports.filter((r) => r.target_type === "comment").map((r) => r.target_id);

  const posts = new Map<string, { title: string; is_removed: boolean }>();
  const comments = new Map<string, { body_text: string; post_id: string; is_removed: boolean }>();

  if (postIds.length) {
    const { data } = await service
      .from("posts")
      .select("id, title, is_removed")
      .in("id", postIds);
    data?.forEach((p) => posts.set(p.id, { title: p.title, is_removed: p.is_removed }));
  }
  if (commentIds.length) {
    const { data } = await service
      .from("comments")
      .select("id, body_text, post_id, is_removed")
      .in("id", commentIds);
    data?.forEach((c) =>
      comments.set(c.id, { body_text: c.body_text, post_id: c.post_id, is_removed: c.is_removed }),
    );
  }

  return reports.map((r) => {
    const reporter = r.reporter as unknown as {
      username: string;
      display_name: string | null;
    } | null;
    if (r.target_type === "post") {
      const p = posts.get(r.target_id);
      return {
        id: r.id,
        reason: r.reason,
        details: r.details,
        created_at: r.created_at,
        reporterName: reporter?.display_name || reporter?.username || "Someone",
        targetType: "post" as const,
        targetId: r.target_id,
        targetExcerpt: p?.title ?? "[post deleted]",
        targetHref: `/post/${r.target_id}`,
        targetRemoved: p?.is_removed ?? true,
        postId: r.target_id,
      };
    }
    const c = comments.get(r.target_id);
    return {
      id: r.id,
      reason: r.reason,
      details: r.details,
      created_at: r.created_at,
      reporterName: reporter?.display_name || reporter?.username || "Someone",
      targetType: "comment" as const,
      targetId: r.target_id,
      targetExcerpt: c?.body_text?.slice(0, 200) ?? "[comment deleted]",
      targetHref: c ? `/post/${c.post_id}` : "/admin/reports",
      targetRemoved: c?.is_removed ?? true,
      postId: c?.post_id ?? null,
    };
  });
}

// ── Admin queries (service client; caller must be verified admin) ──
export async function getAdminStats() {
  const s = createServiceClient();
  const [members, posts, comments, reports, volunteers] = await Promise.all([
    s.from("profiles").select("id", { count: "exact", head: true }),
    s.from("posts").select("id", { count: "exact", head: true }),
    s.from("comments").select("id", { count: "exact", head: true }),
    s.from("reports").select("id", { count: "exact", head: true }).eq("status", "open"),
    s
      .from("volunteer_applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);
  return {
    members: members.count ?? 0,
    posts: posts.count ?? 0,
    comments: comments.count ?? 0,
    openReports: reports.count ?? 0,
    pendingVolunteers: volunteers.count ?? 0,
  };
}

export async function getAllTopics(): Promise<Topic[]> {
  const { data } = await createServiceClient()
    .from("topics")
    .select("*")
    .order("sort_order");
  return (data as Topic[]) ?? [];
}

export async function getAllUsers(search?: string): Promise<Profile[]> {
  let q = createServiceClient()
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (search && search.trim()) {
    q = q.or(`username.ilike.%${search.trim()}%,display_name.ilike.%${search.trim()}%`);
  }
  const { data } = await q;
  return (data as Profile[]) ?? [];
}

export type VolunteerApplication = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  location: string;
  areas: string[];
  skills: string | null;
  availability: string | null;
  experience: string | null;
  motivation: string;
  status: string;
  created_at: string;
  applicant: { username: string } | null;
};

export async function getVolunteerApplications(): Promise<VolunteerApplication[]> {
  const { data } = await createServiceClient()
    .from("volunteer_applications")
    .select(
      "*, applicant:profiles!volunteer_applications_user_id_fkey (username)",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  return (data as unknown as VolunteerApplication[]) ?? [];
}

export type AuditEntry = {
  id: string;
  action: string;
  target_type: string | null;
  created_at: string;
  meta: Record<string, unknown>;
  actorName: string;
};

export async function getAuditLog(): Promise<AuditEntry[]> {
  const { data } = await createServiceClient()
    .from("mod_audit_log")
    .select(
      "id, action, target_type, created_at, meta, actor:profiles!mod_audit_log_actor_id_fkey (username, display_name)",
    )
    .order("created_at", { ascending: false })
    .limit(80);
  return (data ?? []).map((e) => {
    const actor = e.actor as unknown as {
      username: string;
      display_name: string | null;
    } | null;
    return {
      id: e.id,
      action: e.action,
      target_type: e.target_type,
      created_at: e.created_at,
      meta: (e.meta as Record<string, unknown>) ?? {},
      actorName: actor?.display_name || actor?.username || "System",
    };
  });
}

// ── Right sidebar data ───────────────────────────────────────
export async function getCommunityStats() {
  const supabase = await createClient();
  // Members and posts come from the denormalised site_stats row updated
  // by triggers; topics count is small and cheap.
  const [statsRes, topicsRes] = await Promise.all([
    supabase.from("site_stats").select("members_total, posts_total").eq("id", 1).maybeSingle(),
    supabase.from("topics").select("id", { count: "exact", head: true }).eq("is_archived", false),
  ]);
  const stats = statsRes.data as { members_total: number; posts_total: number } | null;
  return {
    members: Number(stats?.members_total ?? 0),
    posts: Number(stats?.posts_total ?? 0),
    topics: topicsRes.count ?? 0,
  };
}

export async function getTrendingTags(
  limit = 6,
): Promise<{ slug: string; count: number }[]> {
  const supabase = await createClient();
  // Reads from the denormalised tag_stats table (kept in sync by trigger
  // post_tags_stats_trg) — avoids scanning the full post_tags table on
  // every sidebar render.
  const { data, error } = await supabase
    .from("tag_stats")
    .select("post_count, tags!inner(slug)")
    .order("post_count", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data
    .map((row) => {
      const tag = row.tags as unknown as { slug: string } | null;
      return { slug: tag?.slug ?? "", count: Number(row.post_count) };
    })
    .filter((t) => t.slug);
}

export async function getNewestMembers(limit = 6): Promise<Profile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as Profile[]) ?? [];
}

// ── Admin dashboard ──────────────────────────────────────────
export type DashboardData = {
  stats: {
    members: number;
    posts: number;
    openReports: number;
    pendingVolunteers: number;
    membersTrend: number;
    postsTrend: number;
    reportsNew: number;
    volunteersNew: number;
  };
  growth: { date: string; total: number }[];
  topTopics: { name: string; count: number }[];
  recentReports: {
    id: string;
    reason: string;
    targetType: string;
    reporterName: string;
    createdAt: string;
    status: string;
  }[];
  pendingVolunteers: {
    id: string;
    name: string;
    createdAt: string;
  }[];
  recentActivity: { id: string; action: string; actorName: string; createdAt: string }[];
};

function pctChange(thisWeek: number, lastWeek: number): number {
  if (lastWeek === 0) return thisWeek > 0 ? 100 : 0;
  return Math.round(((thisWeek - lastWeek) / lastWeek) * 1000) / 10;
}

export async function getDashboardData(): Promise<DashboardData> {
  const s = createServiceClient();
  const now = Date.now();
  const d7 = new Date(now - 7 * 86400000).toISOString();
  const d14 = new Date(now - 14 * 86400000).toISOString();

  const [
    membersTotal,
    postsTotal,
    openReports,
    pendingVol,
    members7,
    members14,
    posts7,
    posts14,
    reports7,
    vol7,
    growthRows,
    topicRows,
    reportRows,
    volRows,
    auditRows,
  ] = await Promise.all([
    s.from("profiles").select("id", { count: "exact", head: true }),
    s.from("posts").select("id", { count: "exact", head: true }),
    s.from("reports").select("id", { count: "exact", head: true }).eq("status", "open"),
    s.from("volunteer_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
    s.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", d7),
    s.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", d14).lt("created_at", d7),
    s.from("posts").select("id", { count: "exact", head: true }).gte("created_at", d7),
    s.from("posts").select("id", { count: "exact", head: true }).gte("created_at", d14).lt("created_at", d7),
    s.from("reports").select("id", { count: "exact", head: true }).gte("created_at", d7),
    s.from("volunteer_applications").select("id", { count: "exact", head: true }).gte("created_at", d7),
    s.from("profiles").select("created_at"),
    s.from("posts").select("topic_id, topics(name)").eq("is_removed", false),
    s
      .from("reports")
      .select("id, reason, target_type, status, created_at, reporter:profiles!reports_reporter_id_fkey(username, display_name)")
      .order("created_at", { ascending: false })
      .limit(4),
    s
      .from("volunteer_applications")
      .select("id, full_name, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(4),
    s
      .from("mod_audit_log")
      .select("id, action, created_at, actor:profiles!mod_audit_log_actor_id_fkey(username, display_name)")
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  // 30-day cumulative member growth
  const created = (growthRows.data ?? [])
    .map((r) => new Date(r.created_at).getTime())
    .sort((a, b) => a - b);
  const growth: { date: string; total: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const dayEnd = now - i * 86400000;
    const total = created.filter((t) => t <= dayEnd).length;
    growth.push({
      date: new Date(dayEnd).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
      total,
    });
  }

  // Top topics by post count
  const topicCounts = new Map<string, number>();
  (topicRows.data ?? []).forEach((r) => {
    const name = (r.topics as unknown as { name: string } | null)?.name;
    if (name) topicCounts.set(name, (topicCounts.get(name) ?? 0) + 1);
  });
  const topTopics = [...topicCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  return {
    stats: {
      members: membersTotal.count ?? 0,
      posts: postsTotal.count ?? 0,
      openReports: openReports.count ?? 0,
      pendingVolunteers: pendingVol.count ?? 0,
      membersTrend: pctChange(members7.count ?? 0, members14.count ?? 0),
      postsTrend: pctChange(posts7.count ?? 0, posts14.count ?? 0),
      reportsNew: reports7.count ?? 0,
      volunteersNew: vol7.count ?? 0,
    },
    growth,
    topTopics,
    recentReports: (reportRows.data ?? []).map((r) => {
      const rep = r.reporter as unknown as { username: string; display_name: string | null } | null;
      return {
        id: r.id,
        reason: r.reason,
        targetType: r.target_type,
        reporterName: rep?.display_name || rep?.username || "Someone",
        createdAt: r.created_at,
        status: r.status,
      };
    }),
    pendingVolunteers: (volRows.data ?? []).map((v) => ({
      id: v.id,
      name: v.full_name,
      createdAt: v.created_at,
    })),
    recentActivity: (auditRows.data ?? []).map((a) => {
      const actor = a.actor as unknown as { username: string; display_name: string | null } | null;
      return {
        id: a.id,
        action: a.action,
        actorName: actor?.display_name || actor?.username || "System",
        createdAt: a.created_at,
      };
    }),
  };
}
