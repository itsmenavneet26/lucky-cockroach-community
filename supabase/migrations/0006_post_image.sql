-- Image posts need a first-class image column.
alter table posts add column if not exists image_url text;

grant insert (image_url) on posts to authenticated;
grant update (image_url) on posts to authenticated;
