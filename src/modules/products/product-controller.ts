import { type Request, type Response } from "express";
import { conn2, database_api, db_estoque, db_publico, db_vendas } from "../../database/database-connection.ts";
import { CategoryErpRepository } from "../categories/repository/categoria-erp-repository.ts";
import { ProductServicesFactory } from "./product-services-factory.ts";
import { ProductErpRepository, type ProductViewFilters } from "./repository/produto-repository.ts";
import { SyncProductsCommand } from "./sync-products-command.ts";
import { ConfigIntegrationRepository } from "../config-integration/config-integration-repository.ts";

/** Opcoes de itens por pagina aceitas na tela de produtos. */
const LIMITES_PAGINA = [25, 50, 100, 200];

/** Itens por pagina quando o parametro limit nao e informado (ou e invalido). */
const LIMITE_PADRAO = 50;

export class ProductController {


    async listProducts(req: Request, res: Response) {
        const productErpRepository = new ProductErpRepository(conn2, db_publico, database_api, db_estoque, db_vendas);
        const categoryErpRepository = new CategoryErpRepository(conn2, db_publico, database_api)

        const filters = normalizarFiltros(req.query)
        const page = normalizarPage(req.query.page)
        const limit = normalizarLimit(req.query.limit)
        const offset = (page - 1) * limit

        const [produtos, totalItems, grupos, subgrupos] = await Promise.all([
            productErpRepository.findProductsForView(filters, limit, offset),
            productErpRepository.countProductsForView(filters),
            categoryErpRepository.findAllCategories(),
            categoryErpRepository.findAllSubcategories(),
        ])

        const totalPages = Math.max(Math.ceil(totalItems / limit), 1)

        res.render('produtos', {
            produtos,
            grupos,
            subgrupos,
            filters: { ...filters, limit },
            pagination: {
                currentPage: page,
                perPage: limit,
                totalItems,
                totalPages,
            },
            activePage: 'produtos',
        })
    }

    async syncProduct( req: Request, res: Response ){
            const productServices = ProductServicesFactory.createProductServices();
            const productErpRepository = new ProductErpRepository(conn2, db_publico, database_api, db_estoque, db_vendas);
            const syncProductsCommand =new SyncProductsCommand(productServices, productErpRepository)

            const configIntegrationRepository = new ConfigIntegrationRepository(conn2, database_api);

            const [ { tabela_precos }] = await configIntegrationRepository.findAll();

        const erpCodeProducts: string[] = req.body.produtos;
       
        let success =0;
        let errors =0;
        let message =[]
        for( const code of erpCodeProducts ){
                const response = await syncProductsCommand.syncProduct(  tabela_precos , Number(code)  )
                     message.push(response.message);
                  if(response.success){
                     success++;
                    }
                 if(!response.success){
                        errors++;
                    }
            
     
         }

        return res.status(200).json({ success ,errors, message: `Fim do processo! \n Erros: ${errors} \n Sucessos: ${success} \n ${message.join(' \n ').toString()}`})
    }


}

/**
 * Normaliza os filtros recebidos na query string da tela de produtos.
 * @param query query string da requisicao
 * @returns ProductViewFilters
 */
export function normalizarFiltros(query: Request['query']): ProductViewFilters {
    const search = String(query.search ?? '').trim() || undefined

    const syncStatusBruto = String(query.sync_status ?? '').trim()
    const syncStatus: ProductViewFilters['syncStatus'] =
        syncStatusBruto === 'synced' || syncStatusBruto === 'not_synced' ? syncStatusBruto : undefined

    const grupo = normalizarNumero(query.grupo)
    const subgrupo = normalizarNumero(query.subgrupo)

    return { search, syncStatus, grupo, subgrupo }
}

/**
 * Converte um valor de query string em numero positivo, ou undefined.
 * @param valor valor recebido na query string
 * @returns numero ou undefined
 */
function normalizarNumero(valor: unknown): number | undefined {
    const numero = Number(valor)
    return Number.isInteger(numero) && numero > 0 ? numero : undefined
}

/**
 * Normaliza o numero da pagina (minimo 1).
 * @param valor valor recebido na query string
 * @returns numero da pagina
 */
export function normalizarPage(valor: unknown): number {
    const page = Number(valor)
    return Number.isInteger(page) && page > 0 ? page : 1
}

/**
 * Normaliza o limite de itens por pagina (apenas as opcoes aceitas).
 * @param valor valor recebido na query string
 * @returns limite de itens por pagina
 */
export function normalizarLimit(valor: unknown): number {
    const limit = Number(valor)
    return LIMITES_PAGINA.includes(limit) ? limit : LIMITE_PADRAO
}
