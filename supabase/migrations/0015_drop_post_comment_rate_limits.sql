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
