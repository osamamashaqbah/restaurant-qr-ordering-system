-- The Angular rewrite talks only to ASP.NET. Keep PostgREST from exposing a
-- second authorization path beside the API.
drop policy if exists "categories_select_public" on public.categories;
drop policy if exists "categories_write_admin" on public.categories;
drop policy if exists "menu_items_select_public" on public.menu_items;
drop policy if exists "menu_items_write_admin" on public.menu_items;
drop policy if exists "order_items_select_staff" on public.order_items;
drop policy if exists "orders_select_staff" on public.orders;
drop policy if exists "orders_update_staff" on public.orders;
drop policy if exists "profiles_select_admin" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_admin" on public.profiles;
drop policy if exists "ratings_select_staff" on public.ratings;
drop policy if exists "security_events_select_admin" on public.security_events;

revoke all on all tables in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

create index if not exists order_items_menu_item_id_idx
  on public.order_items(menu_item_id);
create index if not exists security_events_actor_id_idx
  on public.security_events(actor_id);
create index if not exists security_events_target_id_idx
  on public.security_events(target_id);
