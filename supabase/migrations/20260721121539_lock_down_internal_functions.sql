-- Internal-only helper/trigger functions should not be directly callable via
-- PostgREST RPC by anon/authenticated, even though their current bodies are
-- low-sensitivity (own role / boolean). Defense in depth.
revoke execute on function public.get_my_role() from public, anon, authenticated;
revoke execute on function public.is_staff(public.role_type[]) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.enforce_order_transition() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- set_updated_at was missing a pinned search_path
alter function public.set_updated_at() set search_path = public;
