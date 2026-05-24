-- ============================================================
--  Generic in-DB rate limiting for auth + sensitive mutations.
--  Keyed by an arbitrary string (user id, IP, or email) + action.
-- ============================================================

create table if not exists rate_limit_hits (
  key        text not null,
  action     text not null,
  occurred_at timestamptz not null default now()
);

create index if not exists rate_limit_hits_idx
  on rate_limit_hits (key, action, occurred_at desc);

-- Atomic check + record. Returns true when the new hit is allowed,
-- false when it would breach the limit. Uses an advisory lock per
-- (key, action) so concurrent calls cannot both squeak through.
create or replace function check_action_rate(
  p_key      text,
  p_action   text,
  p_limit    int,
  p_window_s int
) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  used int;
  lock_key bigint := hashtextextended(p_key || ':' || p_action, 0);
begin
  perform pg_advisory_xact_lock(lock_key);

  select count(*) into used from rate_limit_hits
    where key = p_key and action = p_action
      and occurred_at > now() - make_interval(secs => p_window_s);

  if used >= p_limit then
    return false;
  end if;

  insert into rate_limit_hits (key, action) values (p_key, p_action);
  return true;
end;
$$;

grant execute on function check_action_rate(text, text, int, int)
  to anon, authenticated;

-- Housekeeping: a simple periodic cleanup. Either schedule via
-- pg_cron or call manually; entries older than 24 h are useless.
create or replace function purge_rate_limit_hits()
returns void language sql security definer set search_path = public as $$
  delete from rate_limit_hits where occurred_at < now() - interval '24 hours';
$$;

-- RLS: nobody reads this table directly (we go through the RPC).
alter table rate_limit_hits enable row level security;
-- No policies → all direct access denied for anon/authenticated.
