export type Tenant = {
  id: string;
  name: string;
  slug: string;
  status: string;
  whatsapp_number: string | null;
};

export type Category = {
  id: string;
  tenant_id: string;
  name: string;
  sort_order: number;
};

export type Product = {
  id: string;
  tenant_id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  is_active: boolean;
};

export type CartItemInput = {
  productId: string;
  quantity: number;
};

export type CreateOrderInput = {
  tenantSlug: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  orderType: "delivery" | "collection";
  notes?: string;
  items: CartItemInput[];
};
