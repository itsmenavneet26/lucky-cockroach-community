/** Domain types — mirror the Postgres schema (supabase/migrations). */

export type UserRole = "member" | "moderator" | "admin";
export type PostType = "text" | "image" | "link" | "poll";
export type TargetType = "post" | "comment";
export type FollowTarget = "user" | "topic";
export type NotificationType =
  | "reply"
  | "mention"
  | "vote_milestone"
  | "follow"
  | "mod_action";
export type ReportStatus = "open" | "resolved" | "dismissed";
export type ReportReason =
  | "spam"
  | "harassment"
  | "misinformation"
  | "hate"
  | "self_harm"
  | "other";
export type FeedSort = "hot" | "new" | "rising" | "top";

export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  location: string | null;
  pronouns: string | null;
  status: string | null;
  interests: string[];
  role: UserRole;
  karma: number;
  is_banned: boolean;
  onboarded: boolean;
  last_seen: string | null;
  created_at: string;
};

export type Topic = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  rules: string | null;
  icon: string | null;
  accent_color: string | null;
  sort_order: number;
  member_count: number;
  is_archived: boolean;
  created_at: string;
};

export type Post = {
  id: string;
  author_id: string;
  topic_id: string;
  title: string;
  body: unknown;
  body_text: string;
  post_type: PostType;
  link_url: string | null;
  image_url: string | null;
  score: number;
  comment_count: number;
  view_count: number;
  hot_score: number;
  is_pinned: boolean;
  is_locked: boolean;
  is_removed: boolean;
  removed_reason: string | null;
  edited_at: string | null;
  created_at: string;
};

export type Comment = {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  path: string | null;
  depth: number;
  body: unknown;
  body_text: string;
  score: number;
  is_removed: boolean;
  edited_at: string | null;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  type: NotificationType;
  actor_id: string | null;
  target_type: string | null;
  target_id: string | null;
  meta: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
};

export type Badge = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  karma_threshold: number | null;
  is_auto: boolean;
};

export type Tag = { id: string; slug: string; name: string };

export type CrisisResource = { name: string; detail: string; contact: string };

export type Announcement = {
  enabled: boolean;
  text: string;
  href: string;
  image: string;
};

export type HomeHero = {
  heading: string;
  text: string;
  cta_label: string;
  cta_href: string;
  image: string;
};

export type VolunteerHero = {
  heading: string;
  text: string;
  image: string;
};

export type SiteSettings = {
  id: number;
  site_name: string;
  tagline: string;
  registration_open: boolean;
  feature_flags: Record<string, boolean>;
  rate_limits: Record<string, number>;
  crisis_resources: CrisisResource[];
  announcement: Announcement;
  home_hero: HomeHero;
  volunteer_hero: VolunteerHero;
  default_feed_sort: FeedSort;
};

/** Post joined with author + topic — the shape feeds and cards consume. */
export type PostWithMeta = Post & {
  author: Pick<Profile, "id" | "username" | "display_name" | "avatar_url">;
  topic: Pick<Topic, "id" | "slug" | "name">;
  tags: string[];
  viewer_vote: -1 | 0 | 1;
  viewer_saved: boolean;
};

export type CommentWithMeta = Comment & {
  author: Pick<Profile, "id" | "username" | "display_name" | "avatar_url">;
  viewer_vote: -1 | 0 | 1;
};
