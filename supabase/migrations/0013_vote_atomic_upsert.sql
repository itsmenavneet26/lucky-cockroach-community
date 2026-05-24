-- Race-free toggle_vote_atomic.
--
-- The previous implementation read existing_val, then INSERT/UPDATE/DELETE in
-- separate statements. Two concurrent calls from the same user could both see
-- existing_val = NULL, both attempt INSERT, and the second fails with
-- UNIQUE_VIOLATION (23505) — which surfaced to the UI as "Something on our
-- end didn't work" when users tapped the vote button rapidly.
--
-- This version is a single atomic statement per branch:
--   * upsert on (user_id, target_type, target_id) — INSERT or UPDATE in one go
--   * DELETE for the "same value, toggle off" case
--
-- The votes_apply trigger continues to handle score/karma deltas.

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

  -- Lock the row (if any) so concurrent calls see a consistent state.
  select value into existing_val
    from votes
    where user_id = uid and target_type = p_target_type and target_id = p_target_id
    for update;

  if existing_val is not null and existing_val = p_value then
    -- Toggle off.
    delete from votes
      where user_id = uid and target_type = p_target_type and target_id = p_target_id;
  else
    -- Insert new vote or flip the existing one. ON CONFLICT covers the
    -- race where another concurrent call inserted between our SELECT and
    -- INSERT — we just overwrite to the desired value.
    insert into votes (user_id, target_type, target_id, value)
      values (uid, p_target_type, p_target_id, p_value)
      on conflict (user_id, target_type, target_id)
      do update set value = excluded.value
      where votes.value <> excluded.value;
  end if;
end;
$$;

grant execute on function toggle_vote_atomic(target_type, uuid, smallint) to authenticated;
