-- ============================================================
--  Production Hardening — indexes, constraints, atomic RPCs,
--  ban sync, denormalised stats. Safe to run on existing DB.
-- ============================================================

-- ── INDEXES: hot-path queries at scale ────────────────────────
create index if not exists follows_follower_idx
  on follows (follower_id);
create index if not exists follows_target_user_idx
  on follows (target_type, target_id) where target_type = 'user';

create index if not exists topic_members_user_idx
  on topic_members (user_id);

create index if not exists comments_author_active_idx
  on comments (author_id, created_at desc) where is_removed = false;

create index if not exists reports_status_created_idx
  on reports (status, created_at desc);

create index if not exists saves_user_target_idx
  on saves (user_id, target_type, target_id);

create index if not exists votes_user_target_idx
  on votes (user_id, target_type, target_id);

create index if not exists post_tags_tag_idx
  on post_tags (tag_id);

create index if not exists posts_topic_hot_idx
  on posts (topic_id, hot_score desc) where is_removed = false;

create index if not exists posts_topic_created_idx
  on posts (topic_id, created_at desc) where is_removed = false;

create index if not exists posts_author_created_idx
  on posts (author_id, created_at desc);

create index if not exists profiles_karma_idx
  on profiles (karma desc, created_at asc) where is_banned = false;

create index if not exists notifications_user_created_idx
  on notifications (user_id, created_at desc);

-- ── DUPLICATE REPORT PREVENTION ───────────────────────────────
do $$ begin
  alter table reports
    add constraint reports_reporter_target_unique
    unique (reporter_id, target_type, target_id);
exception when duplicate_table then null;
  when duplicate_object then null;
end $$;

-- ── ATOMIC VOTE TOGGLE RPC ────────────────────────────────────
-- Replaces read-modify-write in app code. Single statement; the
-- existing votes_apply trigger handles score/karma deltas.
create or replace function toggle_vote_atomic(
  p_target_type target_type,
  p_target_id   uuid,
  p_value       smallint
) returns void
language plpgsql security invoker set search_path = public as $$
declare
  uid uuid := auth.uid();
  existing_val smallint;
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select value into existing_val
    from votes
    where user_id = uid and target_type = p_target_type and target_id = p_target_id;

  if existing_val is null then
    insert into votes (user_id, target_type, target_id, value)
      values (uid, p_target_type, p_target_id, p_value);
  elsif existing_val = p_value then
    delete from votes
      where user_id = uid and target_type = p_target_type and target_id = p_target_id;
  else
    update votes set value = p_value
      where user_id = uid and target_type = p_target_type and target_id = p_target_id;
  end if;
end;
$$;

grant execute on function toggle_vote_atomic(target_type, uuid, smallint) to authenticated;

-- ── ATOMIC SAVE TOGGLE RPC ────────────────────────────────────
create or replace function toggle_save_atomic(
  p_target_type target_type,
  p_target_id   uuid
) returns boolean
language plpgsql security invoker set search_path = public as $$
declare
  uid uuid := auth.uid();
  existed boolean;
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  delete from saves
    where user_id = uid and target_type = p_target_type and target_id = p_target_id
    returning true into existed;
  if existed then return false; end if;
  insert into saves (user_id, target_type, target_id) values (uid, p_target_type, p_target_id);
  return true;
end;
$$;

grant execute on function toggle_save_atomic(target_type, uuid) to authenticated;

-- ── BAN STATE SYNC: keep profiles.is_banned in lock-step ──────
create or replace function sync_ban_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  uid := coalesce(new.user_id, old.user_id);
  update profiles set is_banned = exists (
    select 1 from bans
      where user_id = uid and topic_id is null
        and (expires_at is null or expires_at > now())
  ) where id = uid;
  return null;
end $$;

drop trigger if exists bans_sync_status_trg on bans;
create trigger bans_sync_status_trg
  after insert or update or delete on bans
  for each row execute function sync_ban_status();

-- ── DENORMALISED SITE STATS (cheap admin dashboard) ───────────
create table if not exists site_stats (
  id            int primary key default 1 check (id = 1),
  members_total bigint not null default 0,
  posts_total   bigint not null default 0,
  comments_total bigint not null default 0,
  updated_at    timestamptz not null default now()
);

insert into site_stats (id, members_total, posts_total, comments_total)
  select 1,
         (select count(*) from profiles),
         (select count(*) from posts),
         (select count(*) from comments)
  on conflict (id) do nothing;

create or replace function bump_site_stat(col text, delta int)
returns void language plpgsql security definer set search_path = public as $$
begin
  execute format('update site_stats set %I = greatest(%I + $1, 0), updated_at = now() where id = 1', col, col)
    using delta;
end $$;

create or replace function site_stats_profiles_trg()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then perform bump_site_stat('members_total', 1);
  elsif tg_op = 'DELETE' then perform bump_site_stat('members_total', -1);
  end if;
  return null;
end $$;

create or replace function site_stats_posts_trg()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then perform bump_site_stat('posts_total', 1);
  elsif tg_op = 'DELETE' then perform bump_site_stat('posts_total', -1);
  end if;
  return null;
end $$;

create or replace function site_stats_comments_trg()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then perform bump_site_stat('comments_total', 1);
  elsif tg_op = 'DELETE' then perform bump_site_stat('comments_total', -1);
  end if;
  return null;
end $$;

drop trigger if exists profiles_site_stats_trg on profiles;
create trigger profiles_site_stats_trg
  after insert or delete on profiles
  for each row execute function site_stats_profiles_trg();

drop trigger if exists posts_site_stats_trg on posts;
create trigger posts_site_stats_trg
  after insert or delete on posts
  for each row execute function site_stats_posts_trg();

drop trigger if exists comments_site_stats_trg on comments;
create trigger comments_site_stats_trg
  after insert or delete on comments
  for each row execute function site_stats_comments_trg();

-- ── TAG STATS: denormalised post counts for trending tags ────
create table if not exists tag_stats (
  tag_id     uuid primary key references tags(id) on delete cascade,
  post_count bigint not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists tag_stats_count_idx on tag_stats (post_count desc);

insert into tag_stats (tag_id, post_count)
  select tag_id, count(*) from post_tags group by tag_id
  on conflict (tag_id) do update set post_count = excluded.post_count;

create or replace function tag_stats_sync()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into tag_stats (tag_id, post_count) values (new.tag_id, 1)
      on conflict (tag_id) do update set post_count = tag_stats.post_count + 1, updated_at = now();
  elsif tg_op = 'DELETE' then
    update tag_stats set post_count = greatest(post_count - 1, 0), updated_at = now()
      where tag_id = old.tag_id;
  end if;
  return null;
end $$;

drop trigger if exists post_tags_stats_trg on post_tags;
create trigger post_tags_stats_trg
  after insert or delete on post_tags
  for each row execute function tag_stats_sync();

-- ── READ POLICIES for new tables ──────────────────────────────
alter table site_stats enable row level security;
alter table tag_stats  enable row level security;
create policy site_stats_read on site_stats for select using (true);
create policy tag_stats_read  on tag_stats  for select using (true);
