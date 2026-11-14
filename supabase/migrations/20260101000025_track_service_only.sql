-- Tracking counters become server-only.
--
-- `track_event` and `track_ad_event` were granted to `anon`, so anybody holding the public anon key
-- (it ships in the browser) could call /rest/v1/rpc/track_event directly and inflate view counts,
-- search counts and ad impressions. That path skips the same-origin check, the meta allow-list and
-- the per-address rate limit in /api/track. The route handler now signs in with the service role,
-- which is the only role allowed to call the two functions.

-- PostgreSQL grants EXECUTE to PUBLIC on every new function, and `track_event` revoked that earlier
-- while `track_ad_event` never did. Revoke from PUBLIC as well, otherwise `anon` keeps the right.
revoke execute on function public.track_event(text, uuid, text, text) from public, anon, authenticated;
revoke execute on function public.track_ad_event(uuid, text, text) from public, anon, authenticated;

grant execute on function public.track_event(text, uuid, text, text) to service_role;
grant execute on function public.track_ad_event(uuid, text, text) to service_role;
