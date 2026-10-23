export type OrderStatus = 'any' | 'open' | 'closed' | 'cancelled';
export type OrderChannel = 'form' | 'store' | 'api' | 'meli' | 'pos';
export type OrderPaymentStatus = 'any' | 'pending' | 'authorized' | 'paid' | 'abandoned' | 'refunded' | 'voided';
export type OrderShippingStatus = 'any' | 'unpacked' | 'unfulfilled' | 'fulfilled';

export interface GetOrdersInput {
  since_id?: number | string;
  status?: OrderStatus;
  channels?: OrderChannel;
  payment_status?: OrderPaymentStatus;
  shipping_status?: OrderShippingStatus;
  created_at_min?: string; // Formato ISO 8601 (ex: "2023-01-01T00:00:00Z")
  created_at_max?: string; // Formato ISO 8601
  updated_at_min?: string; // Formato ISO 8601
  updated_at_max?: string; // Formato ISO 8601
  total_min?: number | string;
  total_max?: number | string;
  customer_ids?: string; // IDs separados por vírgula
  page?: number;
  per_page?: number;
  fields?: string; // Campos separados por vírgula
  q?: string; // Número do pedido, nome ou email
  app_id?: number | string;
  payment_methods?: string;
  payment_provider?: string;
  shipping_method?: string;
  next_action?: string;
  aggregates?: string;
}
