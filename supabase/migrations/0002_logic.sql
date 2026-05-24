-- ============================================================
--  Functions, triggers, RLS, grants — the correctness layer.
-- ============================================================

-- ── HELPER FUNCTIONS (security definer: bypass RLS safely) ───
create or replace function is_admin(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = uid and role = 'admin');
$$;

create or replace function is_moderator(uid uuid, tid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles where id = uid and role in ('admin', 'moderator')
  ) or exists (
    select 1 from topic_members
    where user_id = uid and topic_id = tid and role = 'moderator'
  );
$$;

create or replace function is_user_banned(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_banned from profiles where id = uid), false)
    or exists (
      select 1 from bans
      where user_id = uid and topic_id is null
        and (expires_at is null or expires_at > now())
    );
$$;

create or replace function check_rate_limit(uid uuid, kind text)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare
  lim int;
  used int;
begin
  if kind = 'post' then
    select coalesce((rate_limits->>'post_per_hour')::int, 10) into lim from site_settings where id = 1;
    select count(*) into used from posts
      where author_id = uid and created_at > now() - interval '1 hour';
  else
    select coalesce((rate_limits->>'comment_per_hour')::int, 60) into lim from site_settings where id = 1;
    select count(*) into used from comments
      where author_id = uid and created_at > now() - interval '1 hour';
  end if;
  return used < lim;
end;
$$;

create or replace function increment_post_view(p_id uuid)
returns void language sql security definer set search_path = public as $$
  update posts set view_count = view_count + 1 where id = p_id;
$$;

-- ── NEW USER → PROFILE ───────────────────────────────────────
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base_name text;
  final_name text;
  suffix int := 0;
begin
  base_name := lower(regexp_replace(split_part(coalesce(new.email, 'cockroach'), '@', 1), '[^a-z0-9_]', '', 'g'));
  if char_length(base_name) < 3 then base_name := 'cockroach'; end if;
  base_name := substr(base_name, 1, 16);
  final_name := base_name;
  while exists (select 1 from profiles where username = final_name) loop
    suffix := suffix + 1;
    final_name := base_name || suffix::text;
  end loop;

  insert into profiles (id, username, display_name, avatar_url, role, onboarded)
  values (
    new.id,
    final_name,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', final_name),
    new.raw_user_meta_data->>'avatar_url',
    case when new.email = 'navneet@quantel.in' then 'admin'::user_role else 'member'::user_role end,
    false
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── POST: search vector + hot score ──────────────────────────
create or replace function posts_derive()
returns trigger language plpgsql as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.body_text, '')), 'B');
  new.hot_score :=
    log(greatest(abs(new.score), 1)) +
    (extract(epoch from new.created_at) - 1700000000) / 45000.0;
  return new;
end;
$$;

create trigger posts_derive_trg
  before insert or update of title, body_text, score, created_at on posts
  for each row execute function posts_derive();

-- ── COMMENT: materialized path + depth ───────────────────────
create or replace function comments_set_path()
returns trigger language plpgsql as $$
declare
  parent_path ltree;
  parent_depth int;
begin
  if new.parent_id is null then
    new.depth := 0;
    new.path := text2ltree(replace(new.id::text, '-', ''));
  else
    select path, depth into parent_path, parent_depth
      from comments where id = new.parent_id;
    new.depth := coalesce(parent_depth, 0) + 1;
    new.path := parent_path || replace(new.id::text, '-', '');
  end if;
  return new;
end;
$$;

create trigger comments_set_path_trg
  before insert on comments
  for each row execute function comments_set_path();

-- ── COMMENT COUNT on posts ───────────────────────────────────
create or replace function comments_count_sync()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    if not new.is_removed then
      update posts set comment_count = comment_count + 1 where id = new.post_id;
    end if;
  elsif tg_op = 'DELETE' then
    if not old.is_removed then
      update posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
    end if;
  elsif tg_op = 'UPDATE' and old.is_removed <> new.is_removed then
    update posts set comment_count = greatest(comment_count + (case when new.is_removed then -1 else 1 end), 0)
      where id = new.post_id;
  end if;
  return null;
end;
$$;

create trigger comments_count_trg
  after insert or delete or update of is_removed on comments
  for each row execute function comments_count_sync();

-- ── TOPIC MEMBER COUNT ───────────────────────────────────────
create or replace function topic_member_count_sync()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update topics set member_count = member_count + 1 where id = new.topic_id;
  elsif tg_op = 'DELETE' then
    update topics set member_count = greatest(member_count - 1, 0) where id = old.topic_id;
  end if;
  return null;
end;
$$;

create trigger topic_member_count_trg
  after insert or delete on topic_members
  for each row execute function topic_member_count_sync();

-- ── VOTES → score + karma + milestone notifications ──────────
create or replace function votes_apply()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  delta int;
  tgt_id uuid;
  tgt_type target_type;
  author uuid;
  new_score int;
  old_score int;
  thresholds int[] := array[10, 50, 100, 500];
  th int;
begin
  if tg_op = 'INSERT' then
    delta := new.value;       tgt_id := new.target_id;  tgt_type := new.target_type;
  elsif tg_op = 'DELETE' then
    delta := -old.value;      tgt_id := old.target_id;  tgt_type := old.target_type;
  else
    delta := new.value - old.value; tgt_id := new.target_id; tgt_type := new.target_type;
  end if;

  if delta = 0 then return null; end if;

  if tgt_type = 'post' then
    update posts set score = score + delta
      where id = tgt_id
      returning author_id, score, score - delta into author, new_score, old_score;
    foreach th in array thresholds loop
      if old_score < th and new_score >= th and author <> coalesce(new.user_id, old.user_id) then
        insert into notifications (user_id, type, actor_id, target_type, target_id, meta)
        values (author, 'vote_milestone', null, 'post', tgt_id, jsonb_build_object('score', th));
      end if;
    end loop;
  else
    update comments set score = score + delta
      where id = tgt_id returning author_id into author;
  end if;

  if author is not null then
    update profiles set karma = karma + delta where id = author;
  end if;
  return null;
end;
$$;

create trigger votes_apply_trg
  after insert or delete or update of value on votes
  for each row execute function votes_apply();

-- block self-votes
create or replace function votes_block_self()
returns trigger language plpgsql security definer set search_path = public as $$
declare author uuid;
begin
  if new.target_type = 'post' then
    select author_id into author from posts where id = new.target_id;
  else
    select author_id into author from comments where id = new.target_id;
  end if;
  if author = new.user_id then
    raise exception 'You cannot vote on your own content.';
  end if;
  return new;
end;
$$;

create trigger votes_block_self_trg
  before insert or update on votes
  for each row execute function votes_block_self();

-- ── AUTO BADGES on karma change ──────────────────────────────
create or replace function award_karma_badges()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into user_badges (user_id, badge_id)
  select new.id, b.id from badges b
  where b.is_auto and b.karma_threshold is not null and b.karma_threshold <= new.karma
    and not exists (select 1 from user_badges ub where ub.user_id = new.id and ub.badge_id = b.id);
  return null;
end;
$$;

create trigger award_karma_badges_trg
  after update of karma on profiles
  for each row execute function award_karma_badges();

-- ── REPLY NOTIFICATIONS ──────────────────────────────────────
create or replace function notify_on_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare recipient uuid;
begin
  if new.parent_id is not null then
    select author_id into recipient from comments where id = new.parent_id;
  else
    select author_id into recipient from posts where id = new.post_id;
  end if;
  if recipient is not null and recipient <> new.author_id then
    insert into notifications (user_id, type, actor_id, target_type, target_id)
    values (recipient, 'reply', new.author_id, 'comment', new.id);
  end if;
  return null;
end;
$$;

create trigger notify_on_comment_trg
  after insert on comments
  for each row execute function notify_on_comment();

-- ── FOLLOW NOTIFICATIONS ─────────────────────────────────────
create or replace function notify_on_follow()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.target_type = 'user' and new.target_id <> new.follower_id then
    insert into notifications (user_id, type, actor_id, target_type, target_id)
    values (new.target_id, 'follow', new.follower_id, 'user', new.follower_id);
  end if;
  return null;
end;
$$;

create trigger notify_on_follow_trg
  after insert on follows
  for each row execute function notify_on_follow();

-- ── POLL VOTE COUNT ──────────────────────────────────────────
create or replace function poll_vote_count_sync()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update poll_options set vote_count = vote_count + 1 where id = new.poll_option_id;
  elsif tg_op = 'DELETE' then
    update poll_options set vote_count = greatest(vote_count - 1, 0) where id = old.poll_option_id;
  end if;
  return null;
end;
$$;

create trigger poll_vote_count_trg
  after insert or delete on poll_votes
  for each row execute function poll_vote_count_sync();
