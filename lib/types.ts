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
  image_url: string | null;
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


export type TenantSettings = {
  tenant_id: string;
  business_display_name: string | null;
  storefront_heading: string | null;
  storefront_subheading: string | null;
  admin_heading_label: string | null;
  logo_url: string | null;
  primary_color: string | null;
  accent_color: string | null;
};
