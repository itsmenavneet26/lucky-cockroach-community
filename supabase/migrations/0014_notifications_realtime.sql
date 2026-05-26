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
