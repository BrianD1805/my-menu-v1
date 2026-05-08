-- Orduva Ver-0.184A — Referral rewards currency backfill
-- Optional helper. Run this only if existing referral reward rows were created before Ver-0.184A
-- and still show GBP even though the referred tenant uses another storefront currency.
-- It only updates reward rows that have no monthly subscription amount set yet.

update public.referral_rewards rr
set
  currency_code = upper(ts.currency_code),
  updated_at = now()
from public.tenant_settings ts
where ts.tenant_id = rr.referred_tenant_id
  and ts.currency_code is not null
  and trim(ts.currency_code) <> ''
  and coalesce(rr.monthly_subscription_amount, 0) = 0
  and upper(coalesce(rr.currency_code, 'GBP')) <> upper(ts.currency_code);
