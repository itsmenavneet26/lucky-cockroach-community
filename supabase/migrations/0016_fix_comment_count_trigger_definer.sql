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
