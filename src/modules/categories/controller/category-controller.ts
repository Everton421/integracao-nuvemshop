import { type Request, type Response } from "express";
import { conn2, database_api, db_publico } from "../../../database/database-connection.ts";
import { CategoryServiceFactory } from "../category-service-factory.ts";
import { CategoryErpRepository, type CategoryViewFilters } from "../repository/categoria-erp-repository.ts";
import { CategoriaIntegrationRepository } from "../repository/categoria-integration-repository.ts";
import { type NivelCategoria } from "../../../shared/interfaces/categoria-integracao.ts";

/** Opcoes de itens por pagina aceitas na tela de categorias. */
const LIMITES_PAGINA = [25, 50, 100, 200];

/** Itens por pagina quando o parametro limit nao e informado (ou e invalido). */
const LIMITE_PADRAO = 50;

/** Item selecionado na tela de categorias, no formato "nivel:codigo". */
type CategoriaSelecionada = { nivel: NivelCategoria, codigo: number };

export class CategoryController {

    async list(req: Request, res: Response) {
        const categoryErpRepository = new CategoryErpRepository(conn2, db_publico, database_api);

        const filters = normalizarFiltros(req.query);
        const page = normalizarPage(req.query.page);
        const limit = normalizarLimit(req.query.limit);
        const offset = (page - 1) * limit;

        const [categorias, totalItems] = await Promise.all([
            categoryErpRepository.findCategoriesForView(filters, limit, offset),
            categoryErpRepository.countCategoriesForView(filters),
        ]);

        const totalPages = Math.max(Math.ceil(totalItems / limit), 1);

        res.render('categorias', {
            categorias,
            filters: { ...filters, limit },
            pagination: {
                currentPage: page,
                perPage: limit,
                totalItems,
                totalPages,
            },
            activePage: 'categorias',
        });
    }

    async sendSelected(req: Request, res: Response) {
        const selecionadas = normalizarSelecao(req.body.categorias);

        if (selecionadas.length === 0) {
            return res.status(400).json({ error: 'Nenhuma categoria valida informada para envio.' });
        }

        const categoryServices = CategoryServiceFactory.createCategoryService();
        const categoryErpRepository = new CategoryErpRepository(conn2, db_publico, database_api);
        const categoriaIntegrationRepository = new CategoriaIntegrationRepository(conn2, database_api);

        // Envia os grupos antes das subcategorias, garantindo o pai sincronizado.
        const grupos = selecionadas.filter((item) => item.nivel === 'grupo');
        const subgrupos = selecionadas.filter((item) => item.nivel === 'subgrupo');

        let enviados = 0;
        let falhas = 0;
        const mensagens: string[] = [];

        for (const { codigo } of grupos) {
            try {
                const response = await categoryServices.syncCategory(codigo, true);
                if (response.success) {
                    enviados++;
                    mensagens.push(`Grupo ${codigo} enviado.`);
                } else {
                    falhas++;
                    mensagens.push(response.message || `Grupo ${codigo}: falha no envio.`);
                }
            } catch (error) {
                falhas++;
                mensagens.push(`Grupo ${codigo}: ${(error as Error).message}`);
            }
        }

        for (const { codigo } of subgrupos) {
            try {
                const dadosSubcategoria = await categoryErpRepository.findSubCategoryErpByParams({ CODIGO: codigo, NO_SITE: 'S' });

                if (!dadosSubcategoria.length) {
                    falhas++;
                    mensagens.push(`Subgrupo ${codigo} nao encontrada (ou indisponivel para envio).`);
                    continue;
                }

                const codigoGrupoPai = dadosSubcategoria[0].COD_GRUPO;
                const paiJaEnviado = await categoriaIntegrationRepository.checkShippmentstatus(codigoGrupoPai, 'grupo');

                if (!paiJaEnviado.length) {
                    const responsePai = await categoryServices.syncCategory(codigoGrupoPai, true);
                    if (!responsePai.success) {
                        falhas++;
                        mensagens.push(`Subgrupo ${codigo}: grupo pai ${codigoGrupoPai} nao pôde ser enviado.`);
                        continue;
                    }
                }

                const response = await categoryServices.syncSubCategory(codigo, true);
                if (response.success) {
                    enviados++;
                    mensagens.push(response.message || `Subgrupo ${codigo} enviado.`);
                } else {
                    falhas++;
                    mensagens.push(response.message || `Subgrupo ${codigo}: falha no envio.`);
                }
            } catch (error) {
                falhas++;
                mensagens.push(`Subgrupo ${codigo}: ${(error as Error).message}`);
            }
        }

        return res.json({
            success: enviados,
            errors: falhas,
            msg: `Fim do processo! Enviados: ${enviados} | Falhas: ${falhas}\n${mensagens.join('\n')}`,
        });
    }

}

/**
 * Normaliza os filtros recebidos na query string da tela de categorias.
 * @param query query string da requisicao
 * @returns CategoryViewFilters
 */
export function normalizarFiltros(query: Request['query']): CategoryViewFilters {
    const search = String(query.search ?? '').trim() || undefined;

    const syncStatusBruto = String(query.sync_status ?? '').trim();
    const syncStatus: CategoryViewFilters['syncStatus'] =
        syncStatusBruto === 'synced' || syncStatusBruto === 'not_synced' ? syncStatusBruto : undefined;

    const nivelBruto = String(query.nivel ?? '').trim();
    const nivel: CategoryViewFilters['nivel'] =
        nivelBruto === 'grupo' || nivelBruto === 'subgrupo' ? nivelBruto : undefined;

    const disponivel: CategoryViewFilters['disponivel'] =
        String(query.disponivel ?? '').trim() === 'N' ? 'N' : 'S';

    return { search, syncStatus, nivel, disponivel };
}

/**
 * Converte o array enviado pela tela (formato "nivel:codigo") em itens validos.
 * @param valor valor recebido no corpo da requisicao
 * @returns lista de categorias selecionadas validas
 */
function normalizarSelecao(valor: unknown): CategoriaSelecionada[] {
    const itens = Array.isArray(valor) ? valor : (valor ? [valor] : []);
    const selecionadas: CategoriaSelecionada[] = [];

    for (const item of itens) {
        const [nivel, codigo] = String(item).split(':');
        const codigoNumero = Number(codigo);

        if ((nivel === 'grupo' || nivel === 'subgrupo') && Number.isInteger(codigoNumero) && codigoNumero > 0) {
            selecionadas.push({ nivel, codigo: codigoNumero });
        }
    }

    return selecionadas;
}

/**
 * Normaliza o numero da pagina (minimo 1).
 * @param valor valor recebido na query string
 * @returns numero da pagina
 */
function normalizarPage(valor: unknown): number {
    const page = Number(valor);
    return Number.isInteger(page) && page > 0 ? page : 1;
}

/**
 * Normaliza o limite de itens por pagina (apenas as opcoes aceitas).
 * @param valor valor recebido na query string
 * @returns limite de itens por pagina
 */
function normalizarLimit(valor: unknown): number {
    const limit = Number(valor);
    return LIMITES_PAGINA.includes(limit) ? limit : LIMITE_PADRAO;
}
