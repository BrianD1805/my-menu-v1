begin;

create table if not exists public.tenant_launch_checklists (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  checklist_key text not null,
  title text not null,
  status text not null default 'pending' check (status in ('pending', 'complete')),
  completed_at timestamptz,
  completed_by text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, checklist_key)
);

create index if not exists idx_tenant_launch_checklists_tenant_id
  on public.tenant_launch_checklists (tenant_id);

create index if not exists idx_tenant_launch_checklists_status
  on public.tenant_launch_checklists (tenant_id, status);

alter table public.tenant_launch_checklists enable row level security;

drop policy if exists "service_role_full_access_tenant_launch_checklists" on public.tenant_launch_checklists;
create policy "service_role_full_access_tenant_launch_checklists"
on public.tenant_launch_checklists
for all
to service_role
using (true)
with check (true);

create or replace function public.set_tenant_launch_checklists_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_tenant_launch_checklists_updated_at on public.tenant_launch_checklists;
create trigger trg_tenant_launch_checklists_updated_at
before update on public.tenant_launch_checklists
for each row
execute function public.set_tenant_launch_checklists_updated_at();

commit;
