begin;

-- Supabase Storage bucket for tenant logos and favicons.
-- This replaces the old Netlify/runtime file-write approach, which is not persistent in production.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tenant-assets',
  'tenant-assets',
  true,
  3145728,
  array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/svg+xml',
    'image/x-icon',
    'image/vnd.microsoft.icon'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read is needed because storefront logos/favicons must load in customer browsers.
drop policy if exists "public_read_tenant_assets" on storage.objects;
create policy "public_read_tenant_assets"
on storage.objects
for select
to public
using (bucket_id = 'tenant-assets');

-- Service role performs admin uploads from the server-side API route.
drop policy if exists "service_role_manage_tenant_assets" on storage.objects;
create policy "service_role_manage_tenant_assets"
on storage.objects
for all
to service_role
using (bucket_id = 'tenant-assets')
with check (bucket_id = 'tenant-assets');

commit;
