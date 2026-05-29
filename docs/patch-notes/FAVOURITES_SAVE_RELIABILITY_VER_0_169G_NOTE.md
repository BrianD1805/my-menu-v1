# Orduva Ver-0.169G — favourites save reliability and diagnostics

## Included
- Confirmed there is no intended four-favourite limit in the storefront code
- Reworked favourite saving to use a safer check-then-insert flow instead of relying on Supabase upsert conflict handling
- Duplicate favourites are treated as already saved instead of failing
- Added clearer API error detail/code reporting if Supabase rejects a favourite save
- Extended the temporary storefront error message duration slightly so the real cause can be read

## Not changed
- Favourites carousel layout
- Favourite card styling
- Product card styling
- Stock logic
- Supabase schema
