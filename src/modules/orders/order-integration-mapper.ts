import { type PedidoIntegracao } from "./repositories/order-integration-repository.ts";
import { type NuvemshopOrder } from "./types/types-order-request.ts";

/**
 * Mapeia o pedido vindo da Nuvemshop para a linha da tabela db_api.pedidos.
 */
export class OrderIntegrationMapper {

    /**
     * @param nuvemshopOrder pedido retornado pela Nuvemshop
     * @param codigoClienteErp codigo do cliente no ERP
     * @param codigoPedidoErp codigo do pedido no ERP
     * @returns registro pronto para gravar na tabela pedidos
     */
    toPedidoIntegracao(nuvemshopOrder: NuvemshopOrder, codigoClienteErp: number, codigoPedidoErp: number): PedidoIntegracao {

        return {
            id_nuvemshop: String(nuvemshopOrder.id),
            codigo_pedido_erp: codigoPedidoErp,
            nome_cliente: nuvemshopOrder.contact_name,
            codigo_cliente_erp: codigoClienteErp,
            status_nuvenshop: `${nuvemshopOrder.status}/${nuvemshopOrder.payment_status}`,
            total: Number(nuvemshopOrder.total)
        }
    }
}
