-- ============================================================
--  Why does commenting fail with 42501?
--
--  Paste into Supabase Studio SQL Editor → Run.
--  Share the full output. Three sections; each tells us one thing.
-- ============================================================

-- 1) What policies are currently on the comments table?
--    If row 'comments_insert' is missing OR its `with_check` still
--    contains `check_rate_limit`, then migration 0015 did NOT apply.
--    If it shows `(author_id = auth.uid()) AND (NOT is_user_banned…)`,
--    then 0015 IS applied and the cause is elsewhere.
select
  policyname,
  cmd,
  qual          as using_expr,
  with_check    as with_check_expr
from pg_policies
where schemaname = 'public' and tablename = 'comments'
order by policyname;

-- 2) Are you currently flagged as banned?
--    Replace <YOUR_USER_ID> with your auth.users id (Settings →
--    Account on the site, or look in profiles for your username).
--    Returns one row: { is_banned, function_returns_banned, has_active_ban }
-- ⬇ EDIT THIS UUID before running:
with me as (
  select 'PASTE_YOUR_USER_ID_HERE'::uuid as uid
)
select
  (select is_banned from profiles where id = me.uid)            as profile_is_banned,
  is_user_banned(me.uid)                                        as fn_says_banned,
  exists (
    select 1 from bans
    where user_id = me.uid and topic_id is null
      and (expires_at is null or expires_at > now())
  )                                                             as has_active_site_ban
from me;

-- 3) Does the site_settings row exist with a usable rate_limits JSON?
--    Even if 0015 applied, leftover broken policies on OTHER tables
--    could still hit check_rate_limit and fail. This shows what's
--    actually stored.
select
  id,
  rate_limits,
  pg_typeof(rate_limits)            as type_of_column,
  jsonb_typeof(rate_limits)         as json_kind,
  rate_limits ? 'comment_per_hour'  as has_comment_key,
  rate_limits ? 'post_per_hour'     as has_post_key
from site_settings
where id = 1;
