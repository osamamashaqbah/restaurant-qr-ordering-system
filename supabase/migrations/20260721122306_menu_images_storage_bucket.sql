insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('menu-images', 'menu-images', true, 5242880, array['image/jpeg','image/png','image/webp']);

create policy "menu_images_public_read" on storage.objects
  for select using (bucket_id = 'menu-images');

create policy "menu_images_admin_write" on storage.objects
  for insert with check (bucket_id = 'menu-images' and public.is_staff(array['admin']::public.role_type[]));

create policy "menu_images_admin_update" on storage.objects
  for update using (bucket_id = 'menu-images' and public.is_staff(array['admin']::public.role_type[]));

create policy "menu_images_admin_delete" on storage.objects
  for delete using (bucket_id = 'menu-images' and public.is_staff(array['admin']::public.role_type[]));
