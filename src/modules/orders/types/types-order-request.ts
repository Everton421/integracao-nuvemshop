export interface NuvemshopImage {
  id: number;
  product_id: number;
  src: string;
  position: number;
  alt: any[];
  height?: number;
  width?: number;
  thumbnails_generated?: number;
  created_at: string;
  updated_at: string;
}

export interface NuvemshopAddress {
  address: string;
  city: string;
  country: string;
  created_at: string;
  default: boolean;
  floor: string;
  id: number;
  locality: string;
  name: string;
  number: string;
  phone: string;
  province: string;
  updated_at: string;
  zipcode: string;
  customs?: string | null;
}

export interface NuvemshopCustomer {
  id: number;
  name: string;
  email: string;
  identification: string;
  phone: string;
  note: string | null;
  default_address: NuvemshopAddress;
  addresses: NuvemshopAddress[];
  billing_name: string;
  billing_phone: string;
  billing_address: string;
  billing_number: string;
  billing_floor: string;
  billing_locality: string;
  billing_zipcode: string;
  billing_city: string;
  billing_province: string;
  billing_country: string;
  extra: Record<string, any>;
  total_spent: string;
  total_spent_currency: string;
  last_order_id: number;
  active: boolean;
  first_interaction: string;
  created_at: string;
  updated_at: string;
}

export interface NuvemshopKit {
  id: number;
  variant_id: number;
  name: string;
  image: NuvemshopImage;
  price: string;
}

export interface NuvemshopProduct {
  id: number;
  depth: string;
  height: string;
  name: string;
  name_without_variants?: string | null;
  price: string;
  compare_at_price: string;
  product_id: number;
  image: NuvemshopImage;
  quantity: number | string;
  free_shipping: boolean;
  weight: string;
  width: string;
  variant_id: number | string;
  variant_values: any[];
  properties: any[];
  sku: string | null;
  barcode: string | null;
  has_promotional_price?: boolean;
  promotions?: {
    percentage_off: number;
  };
  catalog_kit_id?: number;
  order_kit_id?: number;
  kit?: NuvemshopKit;
  cost?: string | null;
}

export interface NuvemshopPromotionalDiscount {
  id: number | null;
  store_id: number;
  order_id: string;
  created_at: string;
  total_discount_amount: string;
  contents: any[];
  promotions_applied: any[];
}

export interface NuvemshopCompletedAt {
  date: string;
  timezone_type: number;
  timezone: string;
}

export interface NuvemshopPaymentDetails {
  method: string;
  credit_card_company: string | null;
  installments: number;
}

export interface NuvemshopClientDetails {
  browser_ip: string;
  user_agent: string;
}
export type NuvemshopOrderStatus = "open" | "closed" | "cancelled";
  export type NuvemshopOrderPaymentStatus = 'pending' | "authorized" | "pending" | "paid" | "partially_paid" | "abandoned" | "refunded" | "partially_refunded" | "voided";

export interface NuvemshopOrder {
  id: number;
  token: string;
  store_id: string;
  contact_email: string;
  contact_name: string;
  contact_phone: string;
  contact_identification: string;
  billing_name: string;
  billing_phone: string;
  billing_address: string;
  billing_number: string;
  billing_floor: string;
  billing_locality: string;
  billing_zipcode: string;
  billing_city: string;
  billing_province: string;
  billing_country: string;
  coupon: any[];
  promotional_discount: NuvemshopPromotionalDiscount;
  subtotal: string;
  discount: string;
  discount_coupon: string;
  discount_gateway: string;
  total: string;
  total_usd: string;
  checkout_enabled: boolean;
  weight: string;
  currency: string;
  language: string;
  gateway: string;
  gateway_id: string | null;
  gateway_name: string;
  extra: Record<string, any>;
  storefront: string;
  note: string;
  created_at: string;
  updated_at: string;
  completed_at: NuvemshopCompletedAt;
  payment_details: NuvemshopPaymentDetails;
  same_billing_and_shipping_address: boolean;
  attributes: any[];
  customer: NuvemshopCustomer;
  products: NuvemshopProduct[];
  number: number;
  cancel_reason: string | null;
  owner_note: string | null;
  cancelled_at: string | null;
  closed_at: string | null;
  read_at: string | null;
  status: NuvemshopOrderStatus;
  payment_status:  NuvemshopOrderPaymentStatus;
  gateway_link: string | null;
  shipping_address: NuvemshopAddress;
  shipping_status: string;
  paid_at: string | null;
  client_details: NuvemshopClientDetails;
  app_id: string | null;
  is_subscription: boolean;
  is_subscription_initial: boolean;
}

// Tipo principal para o array retornado pela API
export type NuvemshopOrdersResponse = NuvemshopOrder[];