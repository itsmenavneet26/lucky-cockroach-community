-- Additional optional profile fields collected during onboarding.
alter table profiles
  add column if not exists location text check (location is null or char_length(location) <= 80),
  add column if not exists pronouns text check (pronouns is null or char_length(pronouns) <= 30);

grant update (location, pronouns) on profiles to authenticated;
