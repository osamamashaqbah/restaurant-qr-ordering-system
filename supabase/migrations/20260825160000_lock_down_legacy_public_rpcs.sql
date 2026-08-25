-- The Angular/ASP.NET application reaches these operations only through the
-- API's database connection and the opaque-token/server-side RPCs introduced
-- in the 20260823 migrations. Do not leave the older browser-callable RPCs
-- available as a second authorization path.
--
-- SECURITY DEFINER wrappers can still call these functions as their owner;
-- this only removes PostgREST execution rights for browser roles.
revoke all on function public.create_order(text, text, text, jsonb)
  from public, anon, authenticated;
revoke all on function public.get_public_order(uuid)
  from public, anon, authenticated;
revoke all on function public.submit_rating(uuid, int, text)
  from public, anon, authenticated;

-- These staff/admin browser RPCs are superseded by API-only commands.
revoke all on function public.set_item_availability(uuid, boolean)
  from public, anon, authenticated;
revoke all on function public.get_sales_summary(timestamptz, timestamptz)
  from public, anon, authenticated;
revoke all on function public.list_staff()
  from public, anon, authenticated;
