# Orduva Ver-0.174A — Early preloader minimum display time

## Change

The early static storefront preloader now remains visible for a minimum of 2 seconds.

This prevents the premium “We're getting things ready.” screen from flashing for only a split second when the storefront loads quickly.

## Behaviour

- If the storefront load is quick, the preloader stays up long enough to be read.
- If the storefront load takes longer than 2 seconds, the preloader disappears as soon as the storefront is ready.
- Product-first loading order remains unchanged.
- Customer login, favourites and Buy Again still load after the storefront is visible / in the background.
- Service worker and local storefront cache versions were bumped.

## Supabase

No Supabase SQL required.
