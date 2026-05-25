-- ============================================================
-- Lucky Cockroach Community — pending production migrations
-- Idempotent (CREATE OR REPLACE, IF NOT EXISTS, DROP POLICY
-- IF EXISTS). Safe to re-run.
-- ============================================================

-- ── 0014_notifications_realtime.sql ──
-- Enable Supabase Realtime for the notifications table so the in-app bell
-- can subscribe to INSERTs and refresh without polling. RLS still applies
-- to realtime payloads, so users only ever see their own rows.

do $$
begin
  if not exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    create publication supabase_realtime;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

-- REPLICA IDENTITY FULL lets realtime emit the full row payload (not just
-- the primary key) on UPDATE/DELETE. Useful if we ever stream read-state
-- changes; harmless for INSERT-only consumers today.
alter table public.notifications replica identity full;

-- ── 0015_drop_post_comment_rate_limits.sql ──
-- ============================================================
--  Drop the post + comment rate-limit RLS gates.
--
--  The RLS policy `check_rate_limit(uid, 'comment'|'post')` reads
--  `site_settings.rate_limits`. If that row is missing or the JSON
--  key is null in any environment, the function returns NULL and
--  the policy denies every insert with code 42501 — indistinguishable
--  from a real ban or identity mismatch.
--
--  Posting velocity is now controlled application-side (zod limits,
--  CAPTCHA on signup, ban escalation), not at the RLS layer.
-- ============================================================

drop policy if exists posts_insert    on posts;
drop policy if exists comments_insert on comments;

create policy posts_insert on posts for insert
  with check (author_id = auth.uid()
    and not is_user_banned(auth.uid()));

create policy comments_insert on comments for insert
  with check (author_id = auth.uid()
    and not is_user_banned(auth.uid()));

-- ============================================================
--  Fix: commenting on another user's post fails with 42501.
--
--  comments_count_sync is fired after every insert/update/delete
--  on comments and writes to posts.comment_count. It was created
--  WITHOUT `security definer`, so it ran as the calling user and
--  was checked against posts_update RLS — which requires
--  author_id = auth.uid(). Result: any comment on another user's
--  post raised 42501 from inside the trigger, rolling back the
--  whole insert.
--
--  Marking the trigger function SECURITY DEFINER lets it bypass
--  RLS for the bookkeeping update only. Identity gates on the
--  user's INSERT to comments still apply (comments_insert policy
--  still enforces author_id = auth.uid()).
-- ============================================================

create or replace function comments_count_sync()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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
