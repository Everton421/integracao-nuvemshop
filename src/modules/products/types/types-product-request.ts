// Interface genérica para campos que possuem tradução (pt, es, en)
export interface LocalizedField {
  en: string;
  es: string;
  pt: string;
}

// Interface para a Categoria retornada dentro do produto
export interface ProductResponseCategory {
  created_at: string;
  description: LocalizedField;
  handle: LocalizedField;
  id: number;
  name: LocalizedField;
  parent: number | null;
  subcategories: any[]; // ou crie uma interface específica se necessário
  google_shopping_category: string | null;
  seo_title: LocalizedField;
  seo_description: LocalizedField;
  updated_at: string;
}

// Interface para as Imagens do produto
export interface ProductResponseImage {
  id: number;
  src: string;
  position: number;
  product_id: number;
}

// Interface para as Variantes do produto
export interface ProductResponseVariant {
  id: number;
  promotional_price: string | null;
  created_at: string;
  depth: number | null;
  height: number | null;
  values: any[]; // ou tipo específico para valores de atributos
  price: string;
  product_id: number;
  stock_management: boolean;
  stock: number | null;
  sku: string | null;
  updated_at: string;
  weight: string;
  width: number | null;
  cost: string | null;
}

// Interface Principal do Produto Retornado
export interface NuvemshopProductResponse {
  attributes: any[]; // ou crie uma tipagem específica se usar atributos
  categories: ProductResponseCategory[];
  created_at: string;
  description: LocalizedField;
  handle: LocalizedField;
  id: number;
  images: ProductResponseImage[];
  name: LocalizedField;
  brand: string | null;
  video_url: string | null;
  seo_title: LocalizedField;
  seo_description: LocalizedField;
  canonical_url: string;
  published: boolean;
  visibility: "visible" | "hidden"; // Ajuste conforme os valores possíveis
  requires_shipping: boolean;
  has_stock: boolean;
  is_kit: boolean;
  videos: any[]; // ou tipagem específica para vídeos
  free_shipping: boolean;
  variants: ProductResponseVariant[];
  tags: string;
}