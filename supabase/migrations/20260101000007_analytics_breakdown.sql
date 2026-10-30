-- Aggregated event counts by type and language for the admin analytics page.

create or replace function public.admin_event_breakdown(p_days integer default 30)
returns table (event_type text, lang text, total bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
    select e.event_type, coalesce(e.lang, 'unknown'), count(*)::bigint
    from public.page_events e
    where e.created_at > now() - make_interval(days => greatest(1, least(p_days, 365)))
    group by 1, 2;
end;
$$;

revoke execute on function public.admin_event_breakdown(integer) from public, anon;
grant execute on function public.admin_event_breakdown(integer) to authenticated;
