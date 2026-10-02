import { conn2, database_api } from "../../../database/database-connection.ts";
import { getShopify } from "../../../shared/api/api.ts";
import { type LogsIntegracao } from '../../../shared/interfaces/logs-integracao.ts';
import { LogsIntegration } from "../../logs/log-integration.ts";
import { PedidoIntegration } from "../repository/pedido-integration.ts";

export class UpdateStatusFaturamentoService {


    
    
    /**
     * Processa o faturamento do pedido no Shopify.
     * Diferencia entre Entrega (marcar como Processado) e Retirada (marcar como Pronto para Retirada).
     */
    static async processarFaturamento(order_id: string, numero_nfe: string, chave_nfe: string, id_pedido_integration: number) {
        const pedidoIntegration = new PedidoIntegration();
        const shopify = await getShopify();
        const logIntegration = new LogsIntegration();
        let log: Omit<LogsIntegracao, "id" | "created_at"> = { 
            action: 'Faturamento', 
            dados_shopify: '', 
            message: '', 
            referencia: 'order', 
            status: 'warning', 
            referencia_id: id_pedido_integration 
        };

        try {
            // 1. BUSCAR AS FULFILLMENT ORDERS PARA SABER O MÉTODO DE ENTREGA
            const queryFO = `
                query GetFulfillmentOrders($id: ID!) {
                    order(id: $id) {
                        fulfillmentOrders(first: 5) {
                            nodes {
                                id
                                deliveryMethod {
                                    methodType
                                }
                            }
                        }
                    }
                }
            `;

            const foResult = await shopify.request(queryFO, { variables: { id: order_id } });
            const fulfillmentOrders = foResult.data?.order?.fulfillmentOrders?.nodes || [];

            if (!fulfillmentOrders.length) {
                throw new Error("Nenhuma Fulfillment Order encontrada para este pedido.");
            }

            // 2. ATUALIZAR TAGS E METAFIELDS (NFE)
            const mutationMetafields = `
                mutation UpdateOrderMeta($input: OrderInput!) {
                    orderUpdate(input: $input) {
                        order { id }
                        userErrors { field message }
                    }
                }
            `;

            await shopify.request(mutationMetafields, {
                variables: {
                    input: {
                        id: order_id,
                        tags: ["Pedido faturado", `NFE N° ${numero_nfe}`],
                        metafields: [
                            { namespace: "custom", key: "numero_nfe", type: "single_line_text_field", value: numero_nfe },
                            { namespace: "custom", key: "chave_nfe", type: "single_line_text_field", value: chave_nfe }
                        ]
                    }
                }
            });

            // 3. TRATAR CADA FULFILLMENT ORDER DE ACORDO COM O TIPO
            for (const fo of fulfillmentOrders) {
                if (fo.deliveryMethod?.methodType === "PICK_UP") {
                    // --- CASO RETIRADA NA LOJA ---
                    const mutationPickup = `
                        mutation MarkReadyForPickup($input: FulfillmentOrderLineItemsPreparedForPickupInput!) {
                            fulfillmentOrderLineItemsPreparedForPickup(input: $input) {
                                userErrors { field message }
                            }
                        }
                    `;
                    await shopify.request(mutationPickup, {
                        variables: { input: { lineItemsByFulfillmentOrder: [{ fulfillmentOrderId: fo.id }] } }
                    });
                    
                } else {
                    // --- CASO ENTREGA PADRÃO (Mark as Fulfilled / Processado) ---
                    const mutationFulfillment = `
                        mutation fulfillmentCreateV2($fulfillment: FulfillmentV2Input!) {
                            fulfillmentCreateV2(fulfillment: $fulfillment) {
                                fulfillment { id }
                                userErrors { field message }
                            }
                        }
                    `;
                    await shopify.request(mutationFulfillment, {
                        variables: {
                            fulfillment: {
                                lineItemsByFulfillmentOrder: [{ fulfillmentOrderId: fo.id }],
                                notifyCustomer: false 
                            }
                        }
                    });
                }
            }

            // 4. ATUALIZAR BANCO LOCAL E FINALIZAR LOG
            const resultPedido = await pedidoIntegration.update({ id: id_pedido_integration, status_atendimento: 'FULFILLED' });
            
            if (resultPedido.affectedRows > 0) {
                log.status = "sucess";
                log.message = `Pedido ${order_id} faturado e status de processamento atualizado.`;
                await logIntegration.insert(log);
                return { sucess: true, message: "Pedido atualizado com sucesso!" };
            }

        } catch (error: any) {
            log.status = "error";
            log.message = `Erro ao processar faturamento: ${error.message || JSON.stringify(error)}`;
            await logIntegration.insert(log);
            return { sucess: false, message: log.message };
        }
        
        return { sucess: false, message: "Falha desconhecida ao atualizar pedido" };
    }
}