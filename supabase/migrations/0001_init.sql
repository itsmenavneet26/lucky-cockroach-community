-- ============================================================
--  Lucky Cockroach Community — initial schema
--  Tables, enums, RLS, triggers, functions, indexes, seed data.
-- ============================================================

create extension if not exists pg_trgm;
create extension if not exists ltree;
create extension if not exists citext;

-- ── ENUMS ────────────────────────────────────────────────────
create type user_role          as enum ('member', 'moderator', 'admin');
create type topic_member_role  as enum ('member', 'moderator');
create type post_type          as enum ('text', 'image', 'link', 'poll');
create type target_type        as enum ('post', 'comment');
create type follow_target      as enum ('user', 'topic');
create type notification_type  as enum ('reply', 'mention', 'vote_milestone', 'follow', 'mod_action');
create type report_status      as enum ('open', 'resolved', 'dismissed');
create type report_reason      as enum ('spam', 'harassment', 'misinformation', 'hate', 'self_harm', 'other');

-- ── PROFILES ─────────────────────────────────────────────────
create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     citext unique not null,
  display_name text,
  avatar_url   text,
  banner_url   text,
  bio          text check (char_length(bio) <= 300),
  role         user_role not null default 'member',
  karma        int not null default 0,
  is_banned    boolean not null default false,
  onboarded    boolean not null default false,
  last_seen    timestamptz default now(),
  created_at   timestamptz not null default now()
);

-- ── TOPICS ───────────────────────────────────────────────────
create table topics (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  name         text not null,
  description  text,
  rules        text,
  icon         text,
  accent_color text,
  sort_order   int not null default 0,
  member_count int not null default 0,
  is_archived  boolean not null default false,
  created_by   uuid references profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);

create table topic_members (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  topic_id   uuid not null references topics(id) on delete cascade,
  role       topic_member_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (user_id, topic_id)
);

-- ── POSTS ────────────────────────────────────────────────────
create table posts (
  id             uuid primary key default gen_random_uuid(),
  author_id      uuid not null references profiles(id) on delete cascade,
  topic_id       uuid not null references topics(id) on delete restrict,
  title          text not null check (char_length(title) between 1 and 300),
  body           jsonb not null default '{}'::jsonb,
  body_text      text not null default '',
  post_type      post_type not null default 'text',
  link_url       text,
  score          int not null default 0,
  comment_count  int not null default 0,
  view_count     int not null default 0,
  hot_score      double precision not null default 0,
  is_pinned      boolean not null default false,
  is_locked      boolean not null default false,
  is_removed     boolean not null default false,
  removed_reason text,
  edited_at      timestamptz,
  created_at     timestamptz not null default now(),
  search_vector  tsvector
);

-- ── COMMENTS ─────────────────────────────────────────────────
create table comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references posts(id) on delete cascade,
  author_id   uuid not null references profiles(id) on delete cascade,
  parent_id   uuid references comments(id) on delete cascade,
  path        ltree,
  depth       int not null default 0,
  body        jsonb not null default '{}'::jsonb,
  body_text   text not null default '',
  score       int not null default 0,
  is_removed  boolean not null default false,
  edited_at   timestamptz,
  created_at  timestamptz not null default now()
);

-- ── VOTES / SAVES / FOLLOWS ──────────────────────────────────
create table votes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  target_type target_type not null,
  target_id   uuid not null,
  value       smallint not null check (value in (-1, 1)),
  created_at  timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);

create table saves (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  target_type target_type not null,
  target_id   uuid not null,
  created_at  timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);

create table follows (
  id          uuid primary key default gen_random_uuid(),
  follower_id uuid not null references profiles(id) on delete cascade,
  target_type follow_target not null,
  target_id   uuid not null,
  created_at  timestamptz not null default now(),
  unique (follower_id, target_type, target_id)
);

-- ── NOTIFICATIONS ────────────────────────────────────────────
create table notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  type        notification_type not null,
  actor_id    uuid references profiles(id) on delete cascade,
  target_type text,
  target_id   uuid,
  meta        jsonb not null default '{}'::jsonb,
  is_read     boolean not null default false,
  email_sent  boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ── REPORTS / BANS ───────────────────────────────────────────
create table reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  target_type target_type not null,
  target_id   uuid not null,
  reason      report_reason not null,
  details     text,
  status      report_status not null default 'open',
  resolved_by uuid references profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at  timestamptz not null default now()
);

create table bans (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  topic_id   uuid references topics(id) on delete cascade,
  reason     text,
  banned_by  uuid references profiles(id) on delete set null,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- ── BADGES ───────────────────────────────────────────────────
create table badges (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  name            text not null,
  description     text,
  icon            text,
  karma_threshold int,
  is_auto         boolean not null default false,
  created_at      timestamptz not null default now()
);

create table user_badges (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  badge_id   uuid not null references badges(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

-- ── TAGS ─────────────────────────────────────────────────────
create table tags (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  name       text not null,
  created_at timestamptz not null default now()
);

create table post_tags (
  post_id uuid not null references posts(id) on delete cascade,
  tag_id  uuid not null references tags(id) on delete cascade,
  primary key (post_id, tag_id)
);

-- ── POLLS ────────────────────────────────────────────────────
create table poll_options (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references posts(id) on delete cascade,
  label      text not null,
  vote_count int not null default 0,
  sort_order int not null default 0
);

create table poll_votes (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id) on delete cascade,
  post_id        uuid not null references posts(id) on delete cascade,
  poll_option_id uuid not null references poll_options(id) on delete cascade,
  created_at     timestamptz not null default now(),
  unique (user_id, post_id)
);

-- ── MEDIA / AUDIT / SETTINGS ─────────────────────────────────
create table media (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references profiles(id) on delete cascade,
  url        text not null,
  type       text,
  post_id    uuid references posts(id) on delete set null,
  created_at timestamptz not null default now()
);

create table mod_audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references profiles(id) on delete set null,
  action      text not null,
  target_type text,
  target_id   uuid,
  meta        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create table site_settings (
  id                serial primary key check (id = 1),
  site_name         text not null default 'Lucky Cockroach Community',
  tagline           text not null default 'Share what you''re going through.',
  registration_open boolean not null default true,
  feature_flags     jsonb not null default '{"polls":true,"images":true,"links":true}'::jsonb,
  rate_limits       jsonb not null default '{"post_per_hour":10,"comment_per_hour":60}'::jsonb,
  crisis_resources  jsonb not null default '[]'::jsonb,
  announcement      jsonb not null default '{"enabled":false,"text":"","href":""}'::jsonb,
  default_feed_sort text not null default 'hot',
  updated_at        timestamptz not null default now()
);

-- ── INDEXES ──────────────────────────────────────────────────
create index posts_topic_idx       on posts (topic_id);
create index posts_author_idx      on posts (author_id);
create index posts_hot_idx         on posts (hot_score desc);
create index posts_created_idx     on posts (created_at desc);
create index posts_score_idx       on posts (score desc);
create index posts_search_idx      on posts using gin (search_vector);
create index comments_post_idx     on comments (post_id);
create index comments_path_idx     on comments using gist (path);
create index comments_author_idx   on comments (author_id);
create index votes_target_idx      on votes (target_type, target_id);
create index notifications_user_idx on notifications (user_id, is_read, created_at desc);
create index tags_name_trgm_idx    on tags using gin (name gin_trgm_ops);
create index profiles_username_trgm_idx on profiles using gin (username gin_trgm_ops);
