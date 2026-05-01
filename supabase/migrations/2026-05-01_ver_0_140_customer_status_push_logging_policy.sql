begin;

-- Ensure service role writes to notification_events continue to work even with RLS enabled.
alter table public.notification_events enable row level security;

drop policy if exists "service_role_full_access_notification_events" on public.notification_events;
create policy "service_role_full_access_notification_events"
on public.notification_events
for all
to service_role
using (true)
with check (true);

-- Helpful lookup index for customer-account fallback status push.
create index if not exists idx_customer_push_subscriptions_tenant_account_enabled
  on public.customer_push_subscriptions (tenant_id, customer_account_id, enabled);

commit;
