

/** Objeto enviado no corpo do POST/PUT /categories */
export interface PayloadPostCategory {
    name: { 
      en?: string,
      es?: string,
      pt: string
    }
    description?: {
      en?: string,
      es?: string,
      pt: string
    }
    handle?:{
      en?: string,
      es?: string,
      pt: string
    }
    parent?: number | null
    google_shopping_category?: string
}

 
/** Categoria retornada pela Nuvemshop */
export interface ResponseNuvemshopCategory {
    id: number
    name: {
        en?: string,
        es?: string,
        pt: string
        }
    description?:  {
        en?: string,
        es?: string,
        pt: string
        }
    handle?:  {
        en?: string,
        es?: string,
        pt: string
        }
    parent: number | null
    subcategories?: number[]
    visibility?: string
    google_shopping_category?: string
    created_at?: string
    updated_at?: string
}