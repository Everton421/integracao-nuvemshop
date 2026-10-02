import { type cad_pgru } from "../../../shared/interfaces/cad_pgru.ts"
import { type PayloadPostCategory } from "../types/types-category-request.ts"

/**
 * Idiomas enviados para a Nuvemshop.
 * A loja so aceita idiomas habilitado no painel dela; mandar um idioma nao suportado
 * faz a API recusar a categoria. Por isso vem do .env (CATEGORIAS_IDIOMAS) e o padrao
 * e apenas 'pt', ja que o ERP so mantem descricao em portugues.
 */
function idiomas(): string[] {
    const configurado = process.env.CATEGORIAS_IDIOMAS ?? 'pt'
    return configurado
        .split(',')
        .map((idioma) => idioma.trim().toLowerCase())
        .filter(Boolean)
}

/**
 * Transforma uma categoria do ERP no corpo aceito pelo POST/PUT /categories da Nuvemshop.
 *
 * O campo name e um mapa de idioma -> texto, e nao uma string. parent recebe o id
 * numerico devolvido pela Nuvemshop (null para categoria raiz).
 *
 * @param categoria linha do ERP (cad_pgru ou subgrupos)
 * @param parentIdNuvemshop id do pai ja criado na Nuvemshop, null para grupo raiz
 * @returns PayloadCategoria
 */
export class MappingCategory {

      mappCategory(categoria: cad_pgru, parentIdNuvemshop: number | null = null): PayloadPostCategory {
        const nome = (categoria.NOME ?? '').trim()
        if (!nome) {
            throw new Error(`categoria ${categoria.CODIGO} esta sem NOME/DESCRICAO no ERP.`)
        }
        const langs = idiomas()
        const name: Record<string, string> = {}
            for (const idioma of langs) {
                name[idioma] = nome
            }

        return {
            name:{ 
                pt: categoria.NOME.trim()
            },
            parent: parentIdNuvemshop,
        }
    }

  
}