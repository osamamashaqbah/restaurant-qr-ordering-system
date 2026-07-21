-- Public buckets serve objects via the public /storage/v1/object/public/...
-- URL without needing any RLS SELECT policy at all — that's what makes them
-- "public". The SELECT policy I'd added was only enabling bucket *listing*
-- (storage.list()) for anon/public, which nothing in the app needs (images
-- are always loaded by direct URL). Drop it and replace with an admin-only
-- listing policy for the future admin media manager.
drop policy "menu_images_public_read" on storage.objects;

create policy "menu_images_admin_list" on storage.objects
  for select using (bucket_id = 'menu-images' and public.is_staff(array['admin']::public.role_type[]));
