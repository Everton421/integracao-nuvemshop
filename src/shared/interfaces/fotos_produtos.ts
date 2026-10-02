export interface fotos_produto {
id:number
erp_sku:string
referencia:string | null
cod_barras:string | null
shopify_product_id:string | null
link:string | null
created_at:string
updated_at:string
ativo: 'S' | 'N'
id_postgres: string | null
id_site_antigo: string | null

hash_sha256: string | null
}