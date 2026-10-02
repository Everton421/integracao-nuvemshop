import type { Request, Response } from "express"
import { type CategoriaErp, type CategoriaIntegracao } from "../../../shared/interfaces/categoria-integracao.ts"
import { CategoriaErpRepository } from "../repository/categoria-erp-repository.ts"
import { CategoriaIntegrationRepository } from "../repository/categoria-integration-repository.ts"
import { SyncCategoryService } from "../service/sync-category-service.ts"

type LinhaTela = {
    codigo_sistema: number
    nivel: 'grupo' | 'subgrupo'
    codigo_grupo: number | null
    nome: string
    id_nuvemshop: string | null
    parent_id_nuvemshop: string | null
    sync_status: 'pending' | 'synced' | 'error' | null
    erro: string | null
    pendente: boolean
    /** valor enviado pelo checkbox: nivel:codigo[:codigo_do_grupo] */
    valor: string
}

export class CategoriaController {

    private categoriaErp = new CategoriaErpRepository()
    private categoriaIntegration = new CategoriaIntegrationRepository()
    private syncCategoryService = new SyncCategoryService()

    /**
     * Monta a lista da tela /categorias cruzando o ERP com o que ja foi enviado.
     *
     * @param _req
     * @param res
     */
    async index(_req: Request, res: Response) {
        try {
            const categorias = await this.listar()

            res.render('categorias/index', {
                categorias,
                activePage: 'categorias',
            })
        } catch (erro) {
            console.error("Erro ao carregar categorias:", erro)
            res.status(500).send("Erro interno ao carregar categorias.")
        }
    }

    /**
     * Recebe a selecao da tela e dispara o envio.
     * Espera body.categorias no formato ["grupo:10", "subgrupo:10:250"].
     *
     * @param req
     * @param res
     */
    async send(req: Request, res: Response) {
        try {
            const { grupos, subgrupos } = parseSelecao(req.body?.categorias)

            if (grupos.length === 0 && subgrupos.length === 0) {
                return res.status(400).json({ error: "Selecione ao menos uma categoria." })
            }

            console.log(`[V] Envio manual acionado: [${grupos.length}] grupo(s) e [${subgrupos.length}] subgrupo(s).`)

            const resultado = await this.syncCategoryService.post({ grupos, subgrupos })

            if (resultado.falhas > 0 && resultado.enviados > 0) {
                return res.status(207).json({
                    msg: `Envio concluido com falhas: ${resultado.enviados} enviado(s), ${resultado.falhas} falha(s).`,
                    erros: resultado.erros.slice(0, 20),
                })
            }

            if (resultado.falhas > 0) {
                return res.status(500).json({
                    error: `Nenhuma categoria foi enviada. ${resultado.erros.slice(0, 5).join(' | ')}`,
                })
            }

            return res.json({ msg: `${resultado.enviados} categoria(s) enviada(s) com sucesso!` })
        } catch (erro) {
            console.error("Erro no envio de categorias:", erro)
            return res.status(500).json({
                error: erro instanceof Error ? erro.message : "Erro interno no envio de categorias.",
            })
        }
    }

    /**
     * Le o ERP e junta com o estado de envio guardado em db_api.categorias.
     *
     * @returns LinhaTela[]
     */
    private async listar(): Promise<LinhaTela[]> {

        const [arvore, registros] = await Promise.all([
            this.categoriaErp.findArvoreCompleta(),
            this.categoriaIntegration.findAll(),
        ])

        const porChave = new Map<string, CategoriaIntegracao>()
        for (const registro of registros) {
            porChave.set(`${registro.nivel}:${registro.erp_codigo}`, registro)
        }

        return arvore.map((categoria) => {
            const nivel = categoria.COD_GRUPO ? 'subgrupo' : 'grupo'
            const registro = porChave.get(`${nivel}:${categoria.CODIGO}`)

            const pendente = categoria.IMPORTADO_SITE === 'N' || categoria.ALTERADO_SITE === 'S'

            return {
                codigo_sistema: categoria.CODIGO,
                nivel,
                codigo_grupo: categoria.COD_GRUPO,
                nome: categoria.NOME,
                id_nuvemshop: registro?.id_nuvemshop ?? null,
                parent_id_nuvemshop: registro?.parent_id_nuvemshop ?? null,
                sync_status: registro?.sync_status ?? null,
                erro: registro?.error_message ?? null,
                pendente,
                valor: nivel === 'grupo'
                    ? `grupo:${categoria.CODIGO}`
                    : `subgrupo:${categoria.COD_GRUPO}:${categoria.CODIGO}`,
            }
        })
    }
}

/**
 * Converte os valores do checkbox em listas de codigos.
 * Sem o prefixo de nivel, grupo 10 e subgrupo 10 ficariam indistinguiveis.
 *
 * @param entrada body.categorias vindo do formulario
 * @returns { grupos: number[], subgrupos: number[] }
 */
export function parseSelecao(entrada: unknown): { grupos: number[], subgrupos: number[] } {

    const grupos: number[] = []
    const subgrupos: number[] = []

    if (!Array.isArray(entrada)) {
        return { grupos, subgrupos }
    }

    for (const item of entrada) {
        const partes = String(item).split(':')

        if (partes[0] === 'grupo') {
            const codigo = Number(partes[1])
            if (Number.isInteger(codigo)) grupos.push(codigo)
            continue
        }

        if (partes[0] === 'subgrupo') {
            const codigo = Number(partes[2])
            if (Number.isInteger(codigo)) subgrupos.push(codigo)
            continue
        }

        // valor legado: somente o codigo, tratado como grupo
        const codigo = Number(partes[0])
        if (Number.isInteger(codigo)) grupos.push(codigo)
    }

    return { grupos, subgrupos }
}