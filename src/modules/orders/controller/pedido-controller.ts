import { type Request, type Response } from "express";
import { conn2, database_api, db_publico, db_vendas } from "../../../database/database-connection.ts";
import { ConfigIntegrationRepository } from "../../config-integration/config-integration-repository.ts";
import { DateService } from "../../../shared/utils/date-service.ts";
import { OrderRepository, type OrderViewFilters } from "../repositories/order-repository.ts";
import { ReceiveOrderServiceFactory } from "../services/receive-order-service-factory.ts";

/** Opcoes de itens por pagina aceitas na tela de pedidos. */
const LIMITES_PAGINA = [25, 50, 100, 200];

/** Itens por pagina quando o parametro limit nao e informado (ou e invalido). */
const LIMITE_PADRAO = 25;

const REGEX_DATA = /^\d{4}-\d{2}-\d{2}$/;
const REGEX_DATA_HORA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;

export class PedidoController {

    /**
     * Lista os pedidos recebidos da loja (cad_orca + cad_clie).
     */
    async list(req: Request, res: Response) {
        const orderRepository = new OrderRepository(conn2, db_publico, db_vendas);

        const filters = normalizarFiltros(req.query);
        const page = normalizarPage(req.query.page);
        const limit = normalizarLimit(req.query.limit);
        const offset = (page - 1) * limit;

        const [pedidos, totalItems] = await Promise.all([
            orderRepository.findOrdersForView(filters, limit, offset),
            orderRepository.countOrdersForView(filters),
        ]);

        const totalPages = Math.max(Math.ceil(totalItems / limit), 1);

        res.render('pedidos', {
            pedidos,
            filters: { ...filters, limit },
            pagination: {
                currentPage: page,
                perPage: limit,
                totalItems,
                totalPages,
            },
            activePage: 'pedidos',
        });
    }

    /**
     * Busca manual dos pedidos na Nuvemshop para um periodo informado.
     */
    async syncManual(req: Request, res: Response) {
        const dataInicio = String(req.body.data_inicio ?? '').trim();
        const dataFim = String(req.body.data_fim ?? '').trim() || undefined;

        if (!REGEX_DATA_HORA.test(dataInicio)) {
            return res.status(400).json({ message: 'Informe uma data/hora inicial valida.' });
        }

        if (dataFim && !REGEX_DATA_HORA.test(dataFim)) {
            return res.status(400).json({ message: 'Data/hora final invalida.' });
        }

        if (dataFim && dataFim < dataInicio) {
            return res.status(400).json({ message: 'A data final nao pode ser anterior a data inicial.' });
        }

        const configIntegrationRepository = new ConfigIntegrationRepository(conn2, database_api);
        const [config] = await configIntegrationRepository.findAll();

        const seller = config?.codigo_vendedor ?? 0;
        const priceTable = config?.tabela_precos ?? 0;

        const receiveOrderService = ReceiveOrderServiceFactory.createReceiveService();
        const processados = await receiveOrderService.syncOrdersByPeriod(dataInicio, undefined, seller, priceTable);

        const dateService = new DateService();
        await configIntegrationRepository.updateUltimoRecebimentoPedido(dateService.formatarDataHora(new Date()));

        return res.json({
            message: `Sincronizacao concluida! Pedidos processados: ${processados}.`,
            processados,
        });
    }

}

/**
 * Normaliza os filtros recebidos na query string da tela de pedidos.
 * @param query query string da requisicao
 * @returns OrderViewFilters
 */
export function normalizarFiltros(query: Request['query']): OrderViewFilters {
    const search = String(query.search ?? '').trim() || undefined;

    const dataInicioBruto = String(query.data_inicio ?? '').trim();
    const dataInicio = REGEX_DATA.test(dataInicioBruto) ? dataInicioBruto : undefined;

    const dataFimBruto = String(query.data_fim ?? '').trim();
    const dataFim = REGEX_DATA.test(dataFimBruto) ? dataFimBruto : undefined;

    return { search, dataInicio, dataFim };
}

/**
 * Normaliza o numero da pagina (minimo 1).
 * @param valor valor recebido na query string
 * @returns numero da pagina
 */
export function normalizarPage(valor: unknown): number {
    const page = Number(valor);
    return Number.isInteger(page) && page > 0 ? page : 1;
}

/**
 * Normaliza o limite de itens por pagina (apenas as opcoes aceitas).
 * @param valor valor recebido na query string
 * @returns limite de itens por pagina
 */
export function normalizarLimit(valor: unknown): number {
    const limit = Number(valor);
    return LIMITES_PAGINA.includes(limit) ? limit : LIMITE_PADRAO;
}
