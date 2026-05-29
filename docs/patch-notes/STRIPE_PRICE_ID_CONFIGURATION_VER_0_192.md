# Orduva Ver-0.192 — Stripe Price ID configuration

This patch keeps the Stripe checkout code using Netlify environment variables for Stripe recurring Price IDs.

## Where to check setup

Open the owner platform page:

```text
/platform/billing
```

The page shows all 30 required Stripe Price ID variables and whether they are configured.

## Required Stripe Price IDs

Create one recurring Stripe Price for each plan, currency and billing interval.

Use these exact Orduva amounts:

| Currency | Plan | Monthly | Yearly |
|---|---|---:|---:|
| ZAR | Starter | R125 | R1,200 |
| ZAR | Growth | R225 | R2,160 |
| ZAR | Pro | R325 | R3,120 |
| KES | Starter | KES 1,025 | KES 9,840 |
| KES | Growth | KES 1,665 | KES 15,984 |
| KES | Pro | KES 2,450 | KES 23,520 |
| GBP | Starter | £6.00 | £58 |
| GBP | Growth | £9.50 | £91 |
| GBP | Pro | £14.00 | £134 |
| USD | Starter | $8 | $77 |
| USD | Growth | $13 | $125 |
| USD | Pro | $19 | $182 |
| EUR | Starter | €7.00 | €67 |
| EUR | Growth | €11.00 | €106 |
| EUR | Pro | €16.00 | €154 |

Yearly price rule:

```text
monthly × 12 × 0.8, rounded to the nearest whole number
```

## Netlify environment variables

Add these in Netlify as secret environment variables. Stripe Price IDs start with `price_`.

```bash
STRIPE_PRICE_STARTER_ZAR_MONTHLY=
STRIPE_PRICE_STARTER_ZAR_YEARLY=
STRIPE_PRICE_GROWTH_ZAR_MONTHLY=
STRIPE_PRICE_GROWTH_ZAR_YEARLY=
STRIPE_PRICE_PRO_ZAR_MONTHLY=
STRIPE_PRICE_PRO_ZAR_YEARLY=

STRIPE_PRICE_STARTER_KES_MONTHLY=
STRIPE_PRICE_STARTER_KES_YEARLY=
STRIPE_PRICE_GROWTH_KES_MONTHLY=
STRIPE_PRICE_GROWTH_KES_YEARLY=
STRIPE_PRICE_PRO_KES_MONTHLY=
STRIPE_PRICE_PRO_KES_YEARLY=

STRIPE_PRICE_STARTER_GBP_MONTHLY=
STRIPE_PRICE_STARTER_GBP_YEARLY=
STRIPE_PRICE_GROWTH_GBP_MONTHLY=
STRIPE_PRICE_GROWTH_GBP_YEARLY=
STRIPE_PRICE_PRO_GBP_MONTHLY=
STRIPE_PRICE_PRO_GBP_YEARLY=

STRIPE_PRICE_STARTER_USD_MONTHLY=
STRIPE_PRICE_STARTER_USD_YEARLY=
STRIPE_PRICE_GROWTH_USD_MONTHLY=
STRIPE_PRICE_GROWTH_USD_YEARLY=
STRIPE_PRICE_PRO_USD_MONTHLY=
STRIPE_PRICE_PRO_USD_YEARLY=

STRIPE_PRICE_STARTER_EUR_MONTHLY=
STRIPE_PRICE_STARTER_EUR_YEARLY=
STRIPE_PRICE_GROWTH_EUR_MONTHLY=
STRIPE_PRICE_GROWTH_EUR_YEARLY=
STRIPE_PRICE_PRO_EUR_MONTHLY=
STRIPE_PRICE_PRO_EUR_YEARLY=
```

After adding/changing these variables, trigger a fresh Netlify deploy.

## How checkout uses the values

When the tenant clicks Upgrade with Stripe, Orduva looks up the selected combination:

```text
plan + currency + monthly/yearly
```

and converts it into the matching environment variable name.

Example:

```text
Growth + KES + yearly
→ STRIPE_PRICE_GROWTH_KES_YEARLY
```

If the variable is missing, the checkout button shows a clear configuration error rather than sending the customer to the wrong Stripe price.
