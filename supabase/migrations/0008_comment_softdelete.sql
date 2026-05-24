-- Authors may soft-delete their own comments (RLS still limits to own rows).
-- Soft-delete preserves thread structure for any replies underneath.
grant update (is_removed) on comments to authenticated;
