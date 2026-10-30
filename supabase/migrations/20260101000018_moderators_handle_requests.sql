-- Moderators can read and handle contact messages and correction requests, so the queue does not depend on one person.
-- Deleting stays administrator-only.

drop policy contact_messages_admin_read on public.contact_messages;
drop policy contact_messages_admin_update on public.contact_messages;
create policy contact_messages_staff_read on public.contact_messages for select using (public.is_staff());
create policy contact_messages_staff_update on public.contact_messages for update using (public.is_staff()) with check (public.is_staff());

drop policy correction_requests_admin_read on public.correction_requests;
drop policy correction_requests_admin_update on public.correction_requests;
create policy correction_requests_staff_read on public.correction_requests for select using (public.is_staff());
create policy correction_requests_staff_update on public.correction_requests for update using (public.is_staff()) with check (public.is_staff());
