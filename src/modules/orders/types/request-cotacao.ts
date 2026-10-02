export interface IntelipostCotacaoResponse {
  status: "OK" | "ERROR";
  messages: any[]; // Pode ser tipado conforme os erros da API
  content: CotacaoContent;
  time: string;
  timezone: string;
  locale: string;
}

export interface CotacaoContent {
  origin_zip_code: string;
  destination_zip_code: string;
  platform: string | null;
  additional_information: AdditionalInformation;
  identification: Identification;
  quoting_mode: string | null;
  id: number;
  client_id: number;
  created: number;
  created_iso: string;
  delivery_options: DeliveryOption[];
  volumes: Volume[];
}

export interface AdditionalInformation {
  extra_cost_absolute: number;
  lead_time_business_days: number;
  free_shipping: boolean;
  delivery_method_ids: number[];
  extra_cost_percentage: number;
  tax_id: string;
  client_type: string;
  sales_channel: string;
  payment_type: string | null;
  is_state_tax_payer: boolean | null;
}

export interface Identification {
  session: string;
  ip: string | null;
  page_name: string;
  url: string;
}

export interface DeliveryOption {
  delivery_method_id: number;
  delivery_estimate_business_days: number;
  provider_shipping_cost: number;
  final_shipping_cost: number;
  description: string;
  delivery_note: string | null;
  cubic_weight: number | null;
  delivery_method_type: "EXPRESS" | "STANDARD" | string;
  delivery_method_name: string;
  logistic_provider_name: string;
  scheduling_enabled: boolean;
}

export interface Volume {
  weight: number;
  cost_of_goods: number;
  width: number;
  height: number;
  length: number;
  description: string | null;
  sku_groups_ids: number[] | null;
  volume_type: "BOX" | "BAG" | string;
  quantity_of_items: number
}