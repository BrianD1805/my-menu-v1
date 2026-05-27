alter table public.tenant_settings
  add column if not exists receipt_tax_rate_percent numeric(5,2) not null default 0;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'tenant_settings_receipt_tax_rate_percent_check') then
    alter table public.tenant_settings add constraint tenant_settings_receipt_tax_rate_percent_check check (receipt_tax_rate_percent between 0 and 100);
  end if;
end $$;
