import { getShopify } from "../../../shared/api/api.ts";
import { type LogsIntegracao } from '../../../shared/interfaces/logs-integracao.ts';
import { delay } from "../../../shared/utils/delay.ts";
import { LogsIntegration } from "../../logs/log-integration.ts";
import { PedidoIntegration } from "../repository/pedido-integration.ts";


export class UpdateStatusService {
    /**
     *  atualiza os metafields do pedido, envia o numero e a chave da nota e atualiza o estado do pedido na shopify, para
     * para que nao fique entre os abertos.
     * @param order_id id do pedido da shopify
     * @param numero_nfe 
     * @param chave_nfe 
     * @param id_pedido_integration ID do pedido registrado na tabela pedidos.
     */
    static async updateStatusNotaEnviada(order_id: string, numero_nfe: string, chave_nfe: string, id_pedido_integration: number) {
        const pedidoIntegration = new PedidoIntegration();

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
    `

        const input = {
            input: {
                id: order_id,
                tags: [
                    "Pedido faturado",
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


        const shopify = await getShopify();
        const logIntegration = new LogsIntegration();
        let log: Omit<LogsIntegracao, "id" | "created_at"> = { action: '', dados_shopify: '', message: '', referencia: 'order', status: 'warning', referencia_id: 0 }

        const { data, errors } = await shopify.request(mutation, { variables: input });

        if (errors) {
            console.log(" Erros: ", errors.graphQLErrors || errors)
            log.status = "error";
            log.message = `Erro ao tentar atualizar pedido |   ${errors}`
            log.message = JSON.stringify(errors);
            await logIntegration.insert(log)
            return { sucess: false, message: `Erro ao tentar atualizar pedido |   ${errors}` }

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
            console.log("atualizando status...")
            await delay(500)
            const result = await shopify.request(mutationOrderClose, { variables: inputOrderClose });

            if (result.data && result.data.orderClose.order.id) {
                const resultPedidoIntegration = await pedidoIntegration.update({ id: id_pedido_integration, status_atendimento: 'FULFILLED' })
                if (resultPedidoIntegration.affectedRows > 0) {
                    log.status = "sucess";
                    log.message = `atualizada com sucesso ${order_id} `
                    log.message = JSON.stringify(errors);
                    await logIntegration.insert(log)

                    return { sucess: true, message: "Pedido atualizado com sucesso!" }

                }
            }
        }
    }

}