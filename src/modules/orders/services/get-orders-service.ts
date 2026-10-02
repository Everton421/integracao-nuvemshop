
import { type LogsIntegracao } from  "../../../shared/interfaces/logs-integracao.ts";
import { type par_orca } from "../../../shared/interfaces/par_orca.ts";
import { DateService } from "../../../shared/utils/date-service.ts";
import { ConfiguracoesIntegration } from "../../config-integration/configuracoes-integration-repository.ts";
import { cad_clie_mapper } from "../../custumer/cliente-mapper.ts";
import { GetClientService } from "../../custumer/get-client-service.ts";
import { LogsIntegration } from "../../logs/log-integration.ts";
import { GetOrdersRequest, type clientRequest } from "../get-order-request.ts";
import { PedidoIntegration } from "../repository/pedido-integration.ts";
import { cad_orca_mapper, pro_orca_mapper } from "../pedido-mapper.ts";
import { PedidoRepository } from "../repository/pedido-repository.ts";
import { CalcularStatus } from "../utils/calcular-status-pedido.ts";
import { mapGateway } from "../utils/payment-method-map.ts";


/**
 *    Status financeiro do pedido (financial_status / displayFinancialStatus)
 * AUTHORIZED – Pagamento autorizado, mas ainda não capturado.
 * PENDING – Pagamento pendente (aguardando confirmação; pode falhar).
 * PAID – Pedido totalmente pago.
 * PARTIALLY_PAID – Pedido parcialmente pago.
 * PARTIALLY_REFUNDED – Pagamento parcialmente estornado/reembolsado.
 * REFUNDED – Pagamento totalmente estornado/reembolsado.
 * VOIDED – Pagamento anulado (void).
 * EXPIRED – Autorização/pagamento expirou.
 * 
 * ---------------------------------------------------------------------------------- 
 * Status de fulfillment (envio/entrega)
 *  FULFILLED – Todos os itens do pedido foram enviados/entregues.
 *  PARTIAL – Alguns itens do pedido foram enviados, outros ainda não.
 *  RESTOCKED – Todos os itens foram devolvidos ao estoque e o pedido foi cancelado.
 * 
 */


export class GetPedidosService {

    async getPedidos(lastDateStr: string) {

        const allOrders = await GetOrdersRequest.getOrders({
            lastDateStr,
            status: 'any',
        });

        console.log(`Buscando pedidos a partir de: ${lastDateStr}`);

        const logIntegration = new LogsIntegration();
 
        const configuracoesIntegration = new ConfiguracoesIntegration();
        const dateService = new DateService();
        const pedidoIntegration = new PedidoIntegration();

        for (const order of allOrders) {

            let log = { action: '', referencia: 'order', message: '', referencia_id: 0, status: 'sucess', dados_shopify: JSON.stringify(order) } as Omit<LogsIntegracao, 'id' | 'created_at'>;
            const items = order.lineItems.nodes;
            const shopify_order_id = order.id;
            const shopify_order_number = order.name;
            
            // codigo fulfillment necessario para enviar para intelipost
              const fulfillmentOrderId = order.fulfillmentOrders.nodes[0]?.id;
            
            const shopifyFulfillmentOrderId = fulfillmentOrderId ? String(fulfillmentOrderId.split('/').pop()) : undefined;

             // codigo do envio escolhida na cotação do cliente 
             // é o mesmo da transportadora que esta na teabela transp_frete
                const codshippingLines = Number(order.shippingLines.nodes[0]?.code);     
            const delivery_method_id:any =   codshippingLines ? Number(order.shippingLines.nodes[0].code) : 0

             // tipo do metodo de envio: PICKUP (retirada loja), SHIPPING (entrega), LOCAL_DELIVERY, etc.
            const deliveryMethodType = order.fulfillmentOrders?.nodes?.[0]?.deliveryMethod?.methodType || null
            const deliveryMethod = deliveryMethodType || null


             // cep de origem do pedido.   
            const cepOrigem =  order.fulfillmentOrders?.nodes?.[0]?.assignedLocation?.location?.address?.zip || '';

             let resultCodigoTransportadoraIntersig; 
             let codigoTransportadoraIntersig = 0;

             if( delivery_method_id != 0 &&  !isNaN(delivery_method_id)     ){
             // consulta a relação da codigo da transportadora intelipost X codigo da transportadora intersig 
                 resultCodigoTransportadoraIntersig = await PedidoRepository.consultaTransportadora( Number(delivery_method_id), cepOrigem  );        
                 if( resultCodigoTransportadoraIntersig.length > 0 ){
                   codigoTransportadoraIntersig = resultCodigoTransportadoraIntersig[0].COD_TRANSP_INTERSIG || 0;
                 }

             }


            let total_produtos_sem_desconto = 0
            let total_produtos_com_desconto = 0
            let codigo_cliente = 0;

            let vendedor = 1;
            const dataConfig = await configuracoesIntegration.select();

            if (dataConfig.length > 0) {
                vendedor = dataConfig[0].vendedor_pedido
            }

            const gateway = order.transactions?.[0]?.gateway
            const { formaPagamento, tipoReceb } = mapGateway(gateway)

            items.forEach((i) => {
                if (i.currentQuantity !== 0) {
                    total_produtos_sem_desconto += i.currentQuantity * Number(i.originalUnitPriceSet.shopMoney.amount);
                    total_produtos_com_desconto += Number(i.discountedTotalSet.shopMoney.amount);
                }
            })

            const frete = Number(order.currentShippingPriceSet.shopMoney.amount);
            const orderSubtotal = Number(order.subtotalPriceSet?.shopMoney?.amount || total_produtos_com_desconto);
            const total_desconto = total_produtos_sem_desconto - orderSubtotal;
            let total_geral = orderSubtotal + frete;



            //  -- processamento dos dados do cliente.   
            
                if (!order.localizedFields.edges.length) {
                    log.message = `erro ao registrar pedido, CPF/CNPJ do cliente nao foi informado, pedido: ${order.name}, cliente: ${order.customer.displayName}. `
                    log.action = `registrar cliente`;
                    log.status = 'error';
                    console.log("CPF/CNPJ do pedido nao foi informado")
                    await logIntegration.insert(log);
                    continue;
                }

                // LÓGICA DE TRATAMENTO DO ENDEREÇO (PADRÃO BRASIL)
                // Suporte a pedidos de retirada na loja (shippingAddress = null)
                const endereco = order.shippingAddress ?? order.billingAddress;
                const pickupAddress = order.fulfillmentOrders?.nodes?.[0]?.assignedLocation?.location?.address;

                const address1 = endereco?.address1 || pickupAddress?.address1 || "";
                const address2 = endereco?.address2 || ""; // Complemento

                // O padrão Shopify Brasil no address1 é: "Rua, Número, Bairro"
                const partesEndereco = address1.split(',').map(item => item.trim());

                const rua = partesEndereco[0] || '';
                const numero = partesEndereco[1] || 'S/N';
                const bairro = address2 || partesEndereco[2] || '';
                const complemento = address2;


                const cep = endereco?.zip || pickupAddress?.zip || '00000-000'
                const cidade = endereco?.city || pickupAddress?.city || ''
                const uf = endereco?.provinceCode || pickupAddress?.provinceCode || ''
                const cnpj = order.localizedFields.edges[0].node.value
                const nome = order.customer.displayName 
                const email = order.customer.email || ''
                const clientId = order.customer.id
                const telefone = order.customer.phone || '(00) 00000-0000'
                 const celular=  endereco?.phone || order.customer.phone || '(00) 00000-0000';

                // dados para mapear.
                const clientConfig = { telefone, rua, cep, cidade, uf, cnpj, nome, email, clientId, vendedor , bairro, complemento, numero , celular} as clientRequest;

                // função mapper: retorna os dados para inserir/atualizar cliente no erp.
                let dataClient = cad_clie_mapper(clientConfig)  
                
                // função inteligente, insere/atualiza cliente no erp. 
                codigo_cliente = await GetClientService.insertOrUpdateCLient(dataClient)
            //  -- fim do processamento dos dados do cliente.   

                const statusPedido = CalcularStatus.calcularStatusPedidoShopify(order);


             // retorna os dados do pedido necessarios para registrar o pedido no banco de dados   
            const pedido = cad_orca_mapper(order, codigo_cliente, total_geral, total_produtos_sem_desconto, 1, vendedor, shopifyFulfillmentOrderId || '0' , codigoTransportadoraIntersig, formaPagamento, total_desconto);

            // retorna os dados dos produtos pedido necessarios para registrar o pedido no banco de dados   
            const produtos = await pro_orca_mapper(order, 1, 1, total_produtos_sem_desconto, total_desconto);
            
            // parcelas para registrar no banco de dados 
            const parcelas = [{ parcela: 1, tipo_receb: tipoReceb, valor: total_geral, vencimento: dateService.obterDataAtual() }] as par_orca[]

            
      
               // consulta o pedido para validar se já foi recebido anteriormente
               // 
             const validPedidoIntegration = await pedidoIntegration.selectOrderErpAndIntegration( shopify_order_id);
                
                // verifica se o pedido já foi registrado no sistema anteriormente
            if (validPedidoIntegration.length > 0 && validPedidoIntegration[0].CODIGO && validPedidoIntegration[0].CODIGO > 0 ) {
                console.log(`[V] Pedido ${order.name} já foi recebido, verificando possiveis atualizações...`)

                const { data_atualizacao, CODIGO, id } = validPedidoIntegration[0];

                    // se a data de cancelamento existir, o pedido foi cancelado.
                    // se o status for VOIDED – Pagamento anulado (void)
                    //se o statuts for  EXPIRED – Autorização/pagamento expirou
                if(order.cancelledAt != null  || order.displayFinancialStatus ==  'VOIDED' || order.displayFinancialStatus == 'EXPIRED' ){ 
                console.log(`[V] Pedido ${order.name} Status: ${order.displayFinancialStatus}, Reprovando pedido no sistema.`);

                  const  resultUpdatePedido = await PedidoRepository.updateStatusErpOrder(CODIGO ,'RE');

                          await pedidoIntegration.update({ id: id, status: statusPedido});

                }else{

                    /*
                    if (new Date(order.updatedAt) > new Date(data_atualizacao)) {
                        console.log(`atualizando pedido ${order.name}...`);
                        let updatePedido = pedido as any;
                        updatePedido.CLIENTE = codigo_cliente
                        updatePedido.CODIGO = CODIGO

                        const resultUpdateErpOrder = await PedidoRepository.atualizarpedido(updatePedido, produtos, parcelas)
                        if (resultUpdateErpOrder.affectedRows === 0) {
                            log.message = `Ocorreu um erro ao tentar atualizar pedido : ${order.name} cliente: ${order.customer.displayName}  `
                            log.action = `atualizar pedido`;
                            log.status = 'error';
                        }
                        await pedidoIntegration.update(
                            {
                                id: id,
                                shopify_order_id: shopify_order_id,
                                shopify_order_number: shopify_order_number,
                                erp_order_id: Number(updatePedido.CODIGO),
                                nome_cliente: order.customer.displayName,
                                email_cliente: order.customer.email,
                                preco_total: total_geral,
                                 status:statusPedido,
                                sync_status: "synced",
                                status_pagamento: order.displayFinancialStatus,
                                status_atendimento: order.displayFulfillmentStatus,
                                error_message: "",
                                dados_pedido: JSON.stringify(order),
                                data_atualizacao: dateService.formatarDataHora(order.updatedAt),
                            ...(shopifyFulfillmentOrderId ? { shopifyFulfillmentOrderId } : {}),
                                ...(delivery_method_id ? { delivery_method_id  } : {}),
                                ...(deliveryMethod ? { deliveryMethod } : {}),
                        }
                        )


                        log.message = `Pedido : ${order.name} cliente: ${order.customer.displayName}  atualizado com sucesso!`
                        log.action = `atualizar pedido`;
                        log.status = 'sucess';
                        await logIntegration.insert(log);

                    } else {
                        console.log(`Nao ouve alteração no pedido ${order.name}`);
                    }
                    */
                }

            } else {
                console.log("[V] registrando pedido...")
                const resultinsertErpOrder = await PedidoRepository.cadastrarPedido(pedido, produtos, parcelas, shopifyFulfillmentOrderId || '0', shopify_order_id)

                if (resultinsertErpOrder && resultinsertErpOrder.insertId) {
                    const numpedido = resultinsertErpOrder.insertId;
                    await pedidoIntegration.insertOnDuplicateUpdate(
                        {
                            shopify_order_id: shopify_order_id,
                            shopify_order_number: shopify_order_number,
                            erp_order_id: numpedido,
                            nome_cliente: order.customer.displayName,
                            email_cliente: order.customer.email,
                            preco_total: total_geral,
                            status:statusPedido,
                            sync_status: "synced",
                            status_pagamento: order.displayFinancialStatus,
                            status_atendimento: order.displayFulfillmentStatus,
                            error_message: "",
                            dados_pedido: ``,
                            data_criacao: dateService.formatarData(order.createdAt),
                            data_atualizacao: dateService.formatarDataHora(order.updatedAt),
                            shopifyFulfillmentOrderId,
                            delivery_method_id,
                            deliveryMethod,
                            CANCELADA_ERP: "N",
                            SITUACAO_NFE: null,
                            chave_nf: null,
                            codigo_nf:null,
                            id_pedido_entrega:null,
                            nf_cancelada: null,
                            numero_nf:null,
                            situacao_nf:null
                        }
                    )
                  
                    log.message = `Pedido : ${order.name} cliente: ${order.customer.displayName}  registrado com sucesso!`
                    log.action = `registrar pedido`;
                    log.status = 'sucess';
                    await logIntegration.insert(log);

                } else {
                    log.message = `Ocorreu um erro ao tentar registrar o pedido : ${order.name} cliente: ${order.customer.displayName}  `
                    log.action = `registrar pedido`;
                    log.status = 'error';
                    await logIntegration.insert(log);

                }
            }
             
            
        }

        return allOrders
    }

}
