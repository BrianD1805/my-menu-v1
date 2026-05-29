# Orduva Ver-0.171B — true centre favourites login popup on desktop

## Change

Corrected the logged-out favourites login/create account popup so the modal card is truly centred horizontally and vertically on desktop.

## Detail

The overlay was already using viewport-centred flex positioning, but the inner wrapper was full width and the modal card was not centred inside it. The modal card now uses `mx-auto`, keeping the existing mobile-friendly layout while fixing desktop horizontal centring.

## Supabase

No Supabase SQL required.
