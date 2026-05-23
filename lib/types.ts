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
  stock_enabled?: boolean | null;
  stock_quantity?: number | null;
  low_stock_threshold?: number | null;
};

export type CartItemInput = {
  productId: string;
  quantity: number;
};

export type CreateOrderInput = {
  tenantSlug: string;
  tenantId?: string | null;
  customerName: string;
  customerPhone: string;
  customerAccountId?: string | null;
  customerAddress?: string | null;
  orderType: "delivery" | "collection";
  notes?: string | null;
  paymentProvider?: string | null;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
};


export type TenantSettings = {
  tenant_id: string;
  business_display_name: string | null;
  storefront_heading: string | null;
  storefront_subheading: string | null;
  admin_heading_label: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string | null;
  accent_color: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_whatsapp: string | null;
  contact_address: string | null;
  footer_blurb: string | null;
  footer_notice: string | null;
  show_orduva_referral_ad?: boolean | null;
  currency_name: string | null;
  currency_code: string | null;
  currency_symbol: string | null;
  currency_display_mode: string | null;
  currency_symbol_position: string | null;
  currency_decimal_places: number | null;
  currency_use_thousands_separator: boolean | null;
  currency_decimal_separator: string | null;
  currency_thousands_separator: string | null;
  currency_suffix: string | null;
  enable_cash_on_collection?: boolean | null;
  enable_cash_on_delivery?: boolean | null;
  enable_stripe_customer_payments?: boolean | null;
  stripe_connection_status?: string | null;
  stripe_customer_payment_mode?: string | null;
  stripe_customer_publishable_key?: string | null;
  stripe_customer_account_label?: string | null;
  stripe_customer_test_mode?: boolean | null;
  stripe_customer_setup_notes?: string | null;
  stripe_customer_payments_live?: boolean | null;
  enable_yoco_customer_payments?: boolean | null;
  yoco_connection_status?: string | null;
  yoco_customer_mode?: string | null;
  yoco_customer_account_label?: string | null;
  yoco_customer_setup_notes?: string | null;
  yoco_customer_webhook_id?: string | null;
  yoco_customer_webhook_url?: string | null;
  yoco_customer_payments_live?: boolean | null;
  enable_mpesa_customer_payments?: boolean | null;
  mpesa_connection_status?: string | null;
  mpesa_customer_mode?: string | null;
  mpesa_customer_consumer_key?: string | null;
  mpesa_customer_ipn_id?: string | null;
  mpesa_customer_account_label?: string | null;
  mpesa_customer_setup_notes?: string | null;
  mpesa_customer_payments_live?: boolean | null;
  enable_daraja_customer_payments?: boolean | null;
  daraja_connection_status?: string | null;
  daraja_customer_mode?: string | null;
  daraja_consumer_key?: string | null;
  daraja_shortcode?: string | null;
  daraja_transaction_type?: string | null;
  daraja_account_reference_prefix?: string | null;
  daraja_callback_url?: string | null;
  daraja_account_label?: string | null;
  daraja_setup_notes?: string | null;
  daraja_payments_live?: boolean | null;
  rewards_enabled?: boolean | null;
  rewards_program_name?: string | null;
  rewards_silver_min_spend?: number | null;
  rewards_silver_discount_percent?: number | null;
  rewards_gold_min_spend?: number | null;
  rewards_gold_discount_percent?: number | null;
  rewards_platinum_min_spend?: number | null;
  rewards_platinum_discount_percent?: number | null;
};
