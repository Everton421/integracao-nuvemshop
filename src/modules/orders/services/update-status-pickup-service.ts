import { getShopify } from "../../../shared/api/api.ts";
import { type LogsIntegracao } from '../../../shared/interfaces/logs-integracao.ts';
import { delay } from "../../../shared/utils/delay.ts";
import { LogsIntegration } from "../../logs/log-integration.ts";
import { PedidoIntegration } from "../repository/pedido-integration.ts";

const GET_PICKUP_FO_QUERY = `
  query GetPickupFO($id: ID!) {
    order(id: $id) {
      id
      name
      fulfillmentOrders(first: 10) {
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

const MUTATION_READY_FOR_PICKUP = `
  mutation MarkReadyForPickup($input: FulfillmentOrderLineItemsPreparedForPickupInput!) {
    fulfillmentOrderLineItemsPreparedForPickup(input: $input) {
      userErrors {
        field
        message
      }
    }
  }
`;

export class UpdateStatusPickupService {

    static async updateStatusRetirada(order_id: string, numero_nfe: string, chave_nfe: string, id_pedido_integration: number) {
        const pedidoIntegration = new PedidoIntegration();
        const shopify = await getShopify();
        const logIntegration = new LogsIntegration();
        let log: Omit<LogsIntegracao, "id" | "created_at"> = { action: '', dados_shopify: '', message: '', referencia: 'order', status: 'warning', referencia_id: 0 }

        const foResult = await shopify.request(GET_PICKUP_FO_QUERY, { variables: { id: order_id } });

        if (foResult.errors) {
            log.status = "error";
            log.message = `Erro ao buscar fulfillment orders | ${JSON.stringify(foResult.errors)}`;
            await logIntegration.insert(log);
            return { sucess: false, message: `Erro ao buscar fulfillment orders | ${foResult.errors}` };
        }

        const fulfillmentOrders = foResult.data?.order?.fulfillmentOrders?.nodes || [];
        const pickupFOs = fulfillmentOrders.filter((fo: any) => fo.deliveryMethod?.methodType === "PICK_UP");

        if (!pickupFOs.length) {
            log.status = "warning";
            log.message = `Nenhuma fulfillment order PICKUP encontrada para o pedido ${order_id}`;
            await logIntegration.insert(log);
            return { sucess: false, message: "Nenhuma fulfillment order PICKUP encontrada" };
        }

        const lineItemsByFulfillmentOrder = pickupFOs.map((fo: any) => ({
            fulfillmentOrderId: fo.id,
        }));

        const mutationResult = await shopify.request(MUTATION_READY_FOR_PICKUP, {
            variables: {
                input: {
                    lineItemsByFulfillmentOrder,
                },
            },
        });

        if (mutationResult.errors || mutationResult.data?.fulfillmentOrderLineItemsPreparedForPickup?.userErrors?.length) {
            const userErrors = mutationResult.data?.fulfillmentOrderLineItemsPreparedForPickup?.userErrors || [];
            const errors = mutationResult.errors || userErrors;
            log.status = "error";
            log.message = `Erro ao marcar pronto para retirada | ${JSON.stringify(errors)}`;
            await logIntegration.insert(log);
            return { sucess: false, message: `Erro ao marcar pronto para retirada | ${JSON.stringify(errors)}` };
        }

        const mutation = `
    mutation MarkOrderInvoiced($input: OrderInput!) {
    orderUpdate(input: $input) {
        order {
        id
        metafields(first: 5) {
            edges {
            node {
                namespace
                key
                value
            }
            }
        }
        }
        userErrors {
        field
        message
        }
    }
    }
    `;

        const input = {
            input: {
                id: order_id,
                tags: [
                    "Pedido faturado",
                    "Retirada Loja",
                    `NFE N° ${numero_nfe}`,
                ],
                metafields: [
                    {
                        namespace: "custom",
                        key: "numero_nfe",
                        type: "single_line_text_field",
                        value: `${numero_nfe}`
                    },
                    {
                        namespace: "custom",
                        key: "chave_nfe",
                        type: "single_line_text_field",
                        value: `${chave_nfe}`
                    }
                ]
            }
        }

        const { data, errors } = await shopify.request(mutation, { variables: input });

        if (errors) {
            log.status = "error";
            log.message = `Erro ao tentar atualizar pedido | ${JSON.stringify(errors)}`;
            await logIntegration.insert(log);
            return { sucess: false, message: `Erro ao tentar atualizar pedido | ${errors}` };
        }

        if (data && data.orderUpdate.order.id) {

            const mutationOrderClose =
                ` mutation OrderClose($input: OrderCloseInput!) {
                    orderClose(input: $input) {
                        order {
                        id
                        closedAt
                        }
                        userErrors {
                        field
                        message
                        }
                    }
                    } `

            const inputOrderClose = {
                input: {
                    id: order_id
                }
            }

            await delay(500)
            const result = await shopify.request(mutationOrderClose, { variables: inputOrderClose });

            if (result.data && result.data.orderClose.order.id) {
                const resultPedidoIntegration = await pedidoIntegration.update({ id: id_pedido_integration, status_atendimento: 'FULFILLED' })
                if (resultPedidoIntegration.affectedRows > 0) {
                    log.status = "sucess";
                    log.message = `Pedido retirada loja atualizado com sucesso ${order_id} `;
                    await logIntegration.insert(log);
                    return { sucess: true, message: "Pedido retirada loja atualizado com sucesso!" }
                }
            }
        }

        return { sucess: false, message: "Falha ao atualizar pedido retirada loja" };
    }


     static async updateStatusEmAndamento(order_id: string) {
        const shopify = await getShopify();

        // 1. Buscar as Fulfillment Orders do pedido
        const queryFO = `
            query getFulfillmentOrders($id: ID!) {
                order(id: $id) {
                    fulfillmentOrders(first: 10) {
                        nodes {
                            id
                            status
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
            return { sucess: false, message: "Nenhuma fulfillment order encontrada" };
        }

        // 2. Preparar as mutações de status
        // Se for RETIRADA (PICK_UP), usamos 'preparedForPickup'
        // Se for ENTREGA (SHIPPING), o status 'IN_PROGRESS' é disparado ao aceitar um fulfillment request
        // ou ao criar um fulfillment parcial.
        
        const results = [];

        for (const fo of fulfillmentOrders) {
            if (fo.deliveryMethod?.methodType === "PICK_UP") {
                // Status: "Pronto para Retirada" (No Admin fica como Em Andamento/Pronto)
                const mutationPickup = `
                    mutation fulfillmentOrderLineItemsPreparedForPickup($input: FulfillmentOrderLineItemsPreparedForPickupInput!) {
                        fulfillmentOrderLineItemsPreparedForPickup(input: $input) {
                            userErrors { field message }
                        }
                    }
                `;
                
                const res = await shopify.request(mutationPickup, {
                    variables: {
                        input: {
                            lineItemsByFulfillmentOrder: [{ fulfillmentOrderId: fo.id }]
                        }
                    }
                });
                results.push(res);
            } else {
                // Status: "Em andamento" (Para entregas padrão)
                // Nota: Para ordens de envio, o status muda para IN_PROGRESS quando você aceita 
                // um pedido de fulfillment ou move para processamento.
                const mutationAccept = `
                    mutation fulfillmentOrderAcceptFulfillmentRequest($id: ID!) {
                        fulfillmentOrderAcceptFulfillmentRequest(id: $id) {
                            userErrors { field message }
                        }
                    }
                `;
                const res = await shopify.request(mutationAccept, { variables: { id: fo.id } });
                results.push(res);
            }
        }

        // 3. Opcional: Adicionar uma Tag apenas para controle visual rápido no Admin
        const tagMutation = `
            mutation tagUpdate($id: ID!, $tags: [String!]!) {
                tagsAdd(id: $id, tags: $tags) {
                    node { id }
                    userErrors { message }
                }
            }
        `;
        await shopify.request(tagMutation, { 
            variables: { id: order_id, tags: ["Em andamento"] } 
        });

        return { sucess: true, message: "Status atualizado para em andamento" };
    }
    
}
