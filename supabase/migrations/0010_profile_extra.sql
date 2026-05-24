-- Status (what brings the person here) + interests (multi-select).
alter table profiles
  add column if not exists status text
    check (status is null or char_length(status) <= 40),
  add column if not exists interests text[] not null default '{}';

grant update (status, interests) on profiles to authenticated;
