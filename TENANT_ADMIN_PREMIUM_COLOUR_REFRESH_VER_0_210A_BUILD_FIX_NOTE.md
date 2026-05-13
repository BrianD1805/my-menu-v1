# Orduva Ver-0.210A — Tenant Admin Premium Colour Refresh Build Fix

This small follow-up patch fixes the production build error from Ver-0.210.

## Issue fixed

Next/cssnano failed during CSS minification with:

`Expected an opening square bracket`

The cause was a set of broad CSS attribute selectors in `app/globals.css` that matched Tailwind arbitrary colour classes containing square brackets, for example `class*="bg-[#...]"`. These selectors can parse in development but fail during production CSS minification.

## Fix

Removed the unsafe arbitrary-class attribute selector block and kept the tenant admin colour refresh scoped through the admin shell and direct styles.

## Files changed

- `app/globals.css`
- `lib/version.ts`
- `public/sw.js`

## Supabase SQL

No Supabase SQL required.

## Testing

Run locally:

```bash
npm run build
```

Then deploy:

```bash
git add .
git commit -m "Orduva Ver-0.210A fix tenant admin colour refresh CSS build"
git push origin main
```
