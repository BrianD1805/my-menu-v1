# Orduva Ver-0.208A — Owner editable tenant introduction commission

## Purpose
Adds an owner-editable Tenant intro % field to affiliate-led referral rows in Owner Platform > Referrals.

## Behaviour
- Affiliate % remains the approved affiliate commission, normally 10%.
- Tenant intro % controls the original referring tenant introduction share, normally 5%.
- The tenant intro percentage is saved to referral_rewards.secondary_reward_rate_percent.
- The tenant intro estimated value is saved to referral_rewards.secondary_estimated_monthly_reward.
- Manual subscription payment recording uses the current tenant intro percentage when creating referral_reward_credits.secondary_reward_rate_percent and secondary_reward_amount.

## Scope
Owner Platform referrals only. No storefront, tenant admin, Stripe checkout, product card or sign-in changes.

## Supabase
No new SQL required. This uses columns added in Ver-0.206.
