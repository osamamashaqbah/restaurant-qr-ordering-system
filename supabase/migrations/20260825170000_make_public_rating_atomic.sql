-- The unique constraint on ratings(order_id) is the concurrency authority.
-- Do not check then insert: two requests can both pass that check.
create or replace function public.submit_rating_by_tracking_token(
  p_token_hash bytea,
  p_stars int,
  p_comment text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  target_order_id uuid;
  target_status public.order_status;
begin
  if octet_length(p_token_hash) <> 32 or p_stars < 1 or p_stars > 5 or length(coalesce(p_comment, '')) > 500 then
    return 'not_found';
  end if;

  select order_id into target_order_id from public.order_tracking where token_hash = p_token_hash;
  if target_order_id is null then
    return 'not_found';
  end if;

  select status into target_status from public.orders where id = target_order_id;
  if target_status <> 'closed' then
    return 'not_found';
  end if;

  insert into public.ratings (order_id, stars, comment)
  values (target_order_id, p_stars, trim(coalesce(p_comment, '')))
  on conflict (order_id) do nothing;

  if not found then
    return 'already_rated';
  end if;
  return 'ok';
end;
$$;

revoke all on function public.submit_rating_by_tracking_token(bytea, int, text) from public, anon, authenticated;
