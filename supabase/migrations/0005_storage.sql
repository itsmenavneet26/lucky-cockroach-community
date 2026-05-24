-- ============================================================
--  Storage bucket for user-uploaded media (post images, avatars).
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

create policy "media public read" on storage.objects
  for select using (bucket_id = 'media');

create policy "media authenticated upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'media');

create policy "media owner update" on storage.objects
  for update to authenticated using (bucket_id = 'media' and owner = auth.uid());

create policy "media owner delete" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and owner = auth.uid());
