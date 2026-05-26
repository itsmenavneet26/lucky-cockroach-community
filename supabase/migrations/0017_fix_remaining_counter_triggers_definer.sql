-- ============================================================
--  Same class of bug as 0016. Counter-bookkeeping triggers that
--  write to another table need SECURITY DEFINER to bypass RLS
--  on the target table — otherwise the trigger fails with 42501
--  and rolls back the user's INSERT.
--
--  topic_member_count_sync: writes topics.member_count → topics
--    has no UPDATE policy, so a normal user joining a topic
--    silently rolls back ("0 members" everywhere).
--
--  poll_vote_count_sync: writes poll_options.vote_count → same
--    pattern, voters can't actually vote on a poll.
--
--  posts_derive and comments_set_path are intentionally NOT
--  changed — they're BEFORE triggers that only mutate NEW and
--  don't touch other tables, so RLS never gets involved.
-- ============================================================

create or replace function topic_member_count_sync()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update topics set member_count = member_count + 1 where id = new.topic_id;
  elsif tg_op = 'DELETE' then
    update topics set member_count = greatest(member_count - 1, 0) where id = old.topic_id;
  end if;
  return null;
end;
$$;

create or replace function poll_vote_count_sync()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update poll_options set vote_count = vote_count + 1 where id = new.poll_option_id;
  elsif tg_op = 'DELETE' then
    update poll_options set vote_count = greatest(vote_count - 1, 0) where id = old.poll_option_id;
  end if;
  return null;
end;
$$;

-- One-time backfill: any joins/votes that happened before this fix were
-- rolled back, but if any leaked through (e.g. service-role inserts),
-- recompute counters from source of truth.
update topics t
   set member_count = (select count(*) from topic_members where topic_id = t.id);

update poll_options po
   set vote_count = (select count(*) from poll_votes where poll_option_id = po.id);
