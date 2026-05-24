-- ============================================================
--  Volunteer applications
-- ============================================================

create type volunteer_status as enum ('pending', 'reviewing', 'accepted', 'declined');

create table volunteer_applications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  full_name    text not null,
  email        text not null,
  phone        text not null,
  location     text not null,
  areas        text[] not null default '{}',
  skills       text,
  availability text,
  experience   text,
  motivation   text not null,
  status       volunteer_status not null default 'pending',
  reviewed_by  uuid references profiles(id) on delete set null,
  reviewed_at  timestamptz,
  created_at   timestamptz not null default now()
);

create index volunteer_user_idx   on volunteer_applications (user_id);
create index volunteer_status_idx on volunteer_applications (status, created_at desc);

alter table volunteer_applications enable row level security;

create policy volunteer_insert on volunteer_applications for insert
  with check (user_id = auth.uid() and not is_user_banned(auth.uid()));
create policy volunteer_read on volunteer_applications for select
  using (user_id = auth.uid() or is_admin(auth.uid()));
