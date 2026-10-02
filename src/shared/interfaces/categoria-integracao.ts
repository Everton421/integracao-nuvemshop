export type NivelCategoria = 'grupo' | 'subgrupo'
 

/** Linha da tabela db_api.categorias */
export interface CategoriaIntegracao {
    erp_codigo: number
    nivel: NivelCategoria
    erp_codigo_pai: number | null
    nome: string
    parent_id_nuvemshop: string | null
    sync_status: 'pending' | 'synced' | 'error'
    error_message: string | null
    dados_categoria: string | null
    ultimo_envio: string
    created_at: string
    updated_at: string
    id: number
    id_nuvemshop: string 
    codigo_erp:number
}



/** Categoria retornada pela Nuvemshop */
export interface RespostaCategoriaNuvemshop {
    id: number
    name: Record<string, string>
    description?: Record<string, string>
    handle?: Record<string, string>
    parent: number | null
    subcategories?: number[]
    visibility?: string
    google_shopping_category?: string
    created_at?: string
    updated_at?: string
}

/** Erro retornado pela Nuvemshop (formato dos exemplos de erro da documentacao) */
export interface ErroNuvemshop {
    code: number
    message: string
    description?: string
    [campo: string]: unknown
}

export type ResultadoEnvioCategoria = {
    sucess: boolean
    enviados: number
    falhas: number
    erros: string[]
}