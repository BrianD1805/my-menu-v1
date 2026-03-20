insert into tenants (id, name, slug, whatsapp_number)
values (
  '11111111-1111-1111-1111-111111111111',
  'Demo Restaurant',
  'demo',
  '254700000000'
)
on conflict (slug) do update set whatsapp_number = excluded.whatsapp_number;

insert into categories (id, tenant_id, name, sort_order)
values
  ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'Burgers', 1),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Drinks', 2)
on conflict do nothing;

insert into products (id, tenant_id, category_id, name, description, price, is_active)
values
  ('33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'Classic Burger', 'Beef patty, lettuce, tomato', 7.99, true),
  ('33333333-3333-3333-3333-333333333332', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'Cheese Burger', 'Beef patty with cheese', 8.99, true),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Cola', '330ml can', 1.99, true)
on conflict do nothing;
