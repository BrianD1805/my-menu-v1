# My Menu V1

A minimal multi-tenant online ordering demo built with Next.js and Supabase.

## What this version does

- serves a tenant storefront from `demo.localhost:3000`
- shows menu categories and products
- stores cart in localStorage
- places offline orders into Supabase
- creates a WhatsApp-ready message for the merchant
- opens WhatsApp with the saved order message
- shows orders in `/admin/orders`
- lets the merchant update order status

## Tech stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Postgres
- WhatsApp deep link handoff
- Netlify-ready config

## 1. Install dependencies

```bash
npm install
```

## 2. Create a Supabase project

Copy `.env.example` to `.env.local` and set:

```env
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## 3. Load the database

Run the SQL in this order inside Supabase SQL editor:

1. `supabase/schema.sql`
2. `supabase/seed.sql`

## 4. Local subdomain testing

Many systems already resolve `*.localhost`, but if yours does not, add this to your hosts file:

```text
127.0.0.1 demo.localhost
```

Then start the app:

```bash
npm run dev
```

Visit:

```text
http://demo.localhost:3000
```

## 5. What to test

1. open the storefront
2. add products to cart
3. go to checkout
4. place an order
5. confirm WhatsApp opens with the order text
6. open `/admin/orders`
7. confirm the order exists
8. change the order status

## 6. Deploying to Netlify

1. push the repo to GitHub or upload it to Netlify
2. make sure the site uses the Next.js runtime on Netlify
3. set the environment variables from `.env.example`
4. deploy

For the first hosted test, use the root hostname. The code falls back to the `demo` tenant when no subdomain is present.

## Current intentional limitations

This v1 does not yet include:

- Stripe
- authentication
- full tenant onboarding automation
- custom domains
- product options and modifiers
- image upload pipeline
- official WhatsApp Business API integration

## Basic admin protection

Admin routes are protected with HTTP Basic Auth using these environment variables:

- `ORDUVA_ADMIN_USERNAME`
- `ORDUVA_ADMIN_PASSWORD`

Protected paths:
- `/admin/orders`
- `/admin/products`
- `/api/admin/*`
- `/api/products`

Set the same values locally in `.env.local` and in Netlify environment variables before testing admin screens.
