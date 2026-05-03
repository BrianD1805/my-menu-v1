begin;

-- Ver-0.148A
-- ZimZa Express was the original demo tenant and previously used the legacy slug "orduva".
-- Move it to the customer/demo-facing store address: zimzaexpress.orduva.com

update public.tenants
set slug = 'zimzaexpress'
where slug = 'orduva'
  and lower(name) in ('zimza express', 'zimzaexpress');

commit;
