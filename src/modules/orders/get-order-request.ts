
import { getShopify } from "../../shared/api/api.ts";


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


export type requestOrder = {
    id: string
    name: string,
     cancelledAt: string | null,
     closedAt: string | null
    localizedFields: {
        edges: [
            {
                node: {
                    countryCode: string
                    purpose: string
                    title: string
                    value: string
                }
            }
        ]
    }
    note: string,
    createdAt: string
    updatedAt: string
    displayFinancialStatus: 'AUTHORIZED' | 'EXPIRED' | 'PAID' | 'PARTIALLY_PAID' | 'PARTIALLY_REFUNDED' | 'PENDING' | 'REFUNDED' | 'VOIDED',
    displayFulfillmentStatus: 'UNFULFILLED' | 'SCHEDULED' | 'RESTOCKED' | 'REQUEST_DECLINED' | 'PENDING_FULFILLMENT' | 'PARTIALLY_FULFILLED' | 'OPEN' | 'ON_HOLD' | 'IN_PROGRESS' | 'FULFILLED',
    
    // NOVO: Tipagem para Metafields
    metafields: {
        edges: [
            {
                node: {
                    id: string
                    namespace: string
                    key: string
                    value: string
                    type: string
                }
            }
        ]
    },
     // paymentTerms: {
     //         id:string
     //         }

    shippingLines: {
        nodes: [
            {
                phone:string
                title: string
                code: string | null
                source: string | null
                carrierIdentifier: string | null
                discountedPriceSet: {
                    shopMoney: {
                        amount: string | number
                    }
                }

                originalPriceSet: {
                    shopMoney: {
                        amount: string | number
                    }
                }
            }
        ]
    },
    currentShippingPriceSet: {
        shopMoney: {
            amount: string | number
        }
    },
    totalPriceSet: {
        shopMoney: {
            amount: string | number,
            currencyCode: string | 'BRL'
        }
    },
    subtotalPriceSet: {
        shopMoney: {
            amount: string | number
        }
    },

 transactions: {
        id: string
        gateway: string
        status: string
        paymentId:string
         parentTransaction :{ formattedGateway:string  }
         receiptJson:any,
         order:{
          id:any
         }
        amountSet: { shopMoney: { amount: string } }
    }[]


    email: string
    shippingAddress: {
        address1: string
        address2: string | null
        zip: string
        city: string,
        provinceCode: string
        company: string | null
        phone: string | null
        formattedArea:string | null
    } | null
    billingAddress: {
        address1: string
        address2: string | null
        zip: string
        city: string
        provinceCode: string
        phone: string | null
    } | null
    customer: {
        firstName: string
        lastName: string
        displayName: string
        email: string
        id: string
        phone: string
    },
    lineItems: {
        nodes: [
            {
                id: string
                name: string
                sku: string
                quantity: number
                currentQuantity: number
                variant: {
                    id: string
                    inventoryItem: {
                        id: string
                        inventoryLevels: {
                            edges: [
                                {
                                    node: {
                                        location: {
                                            id: string
                                            name: string
                                        }
                                    }
                                }
                            ]
                        }
                    }
                },
                originalUnitPriceSet: {
                    shopMoney: {
                        amount: string | number
                        currencyCode: string | 'BRL'
                    }
                }
                discountedTotalSet: {
                    shopMoney: {
                        amount: string | number
                        currencyCode: string | 'BRL'
                    }
                }
            }
        ]
    }
    fulfillmentOrders: {
        nodes: [
            {
                id: string,
                status: string
                requestStatus: string
                  deliveryMethod :{
                    maxDeliveryDateTime:string
                    minDeliveryDateTime:string
                    presentedName:string
                    serviceCode:string 
                    methodType:string 
                    sourceReference:string
                 
                }

                assignedLocation: {
                    location: {
                        id: string
                        name: string
                        legacyResourceId: string // ID numérico para o ERP
                        address: {
                            address1: string
                            city: string
                            zip: string
                            provinceCode: string
                        }
                    }
                }
            }
        ]
    }
}


export type clientRequest = {
    rua: string
   numero: string      // Adicionado
    bairro: string      // Adicionado
    complemento: string // Adicionado
    cep: string
    cidade: string
    uf: string
    cnpj: string
    nome: string
    email: string
    clientId: string
    telefone: string
    vendedor: number
    celular:string
}


type statusOrder=  
    | 'open'
    | 'closed'
    | 'cancelled'
    | 'not_closed'
    | 'any'


type financial_statusOrder =  
      'paid'
   | 'pending'
    | 'authorized'
    | 'partially_paid'
    | 'partially_refunded'
    | 'refunded'
    | 'voided'
    | 'expired'
 

type fulfillment_statusOrder=  
    'unshipped'
    | 'shipped'
    | 'fulfilled'
    | 'partial'
    | 'scheduled'
    | 'on_hold'
    | 'unfulfilled'
    | 'request_declined'




export class GetOrdersRequest {


   static async getOrders( queryOrder:{ lastDateStr?: string, status?:statusOrder , financial_status?:financial_statusOrder, fulfillment_status?: fulfillment_statusOrder}) {

            const { financial_status, fulfillment_status , lastDateStr, status} =queryOrder;

        const query = `
     query getOrders($cursor: String, $filter: String) {
        orders(first: 20, after: $cursor, query: $filter, sortKey: UPDATED_AT, reverse: false) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            name
            createdAt
            updatedAt
            closedAt
            cancelledAt
            localizedFields(first: 20) {
              edges {
                node {
                  countryCode
                  purpose
                  title
                  value
                }
              }
            }
            
            note
            displayFinancialStatus
            displayFulfillmentStatus
            
            # BUSCA DE METAFIELDS (Para encontrar Quote ID ou dados extras da Intelipost)
            metafields(first: 20) {
              edges {
                node {
                  id
                  namespace
                  key
                  value
                  type
                }
              }
            }
        


            shippingLines(first: 5) {
              nodes {
                title
                code
                source
                custom
                id
                deliveryCategory
                taxLines { 
                  source
                  title
                }
                  
                phone
                carrierIdentifier
                discountedPriceSet {
                  shopMoney {
                    amount
                  }
                }
                  originalPriceSet {
                  shopMoney {
                    amount
                  }
                }
              }
            }
            currentShippingPriceSet {
              shopMoney {
                amount
              }
            }
      transactions(first: 5) {
                id
                gateway
                status
                paymentId
                parentTransaction {
                  formattedGateway
                }

              ##
                order{
                   id
                   legacyResourceId
                     paymentTerms {
                      id
                    }
                }
              ##   

                receiptJson
                amountSet {
                  shopMoney {
                    amount
                  }
                }

          }

            totalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            subtotalPriceSet {
              shopMoney {
                amount
              }
            }
            email
            shippingAddress {
              address1
              address2
              zip
              city
              provinceCode
              company
              phone
              formattedArea
            }
            billingAddress {
              address1
              address2
              zip
              city
              provinceCode
              phone
            }
            customer {
              firstName
              lastName
              displayName
              email
              id
              phone
            }
            lineItems(first: 100) {
              nodes {
                id
                name
                sku
                quantity
                variant {
                  id
                  inventoryItem {
                    id
                    inventoryLevels(first: 10) {
                      edges {
                        node {
                          location {
                            id
                            name
                          }
                        }
                      }
                    }
                  }
                }
                currentQuantity
                originalUnitPriceSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
                discountedTotalSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
              }
            }
            fulfillmentOrders(first: 10) {
              nodes {
                id
                status
                requestStatus
                deliveryMethod {
                  maxDeliveryDateTime
                  minDeliveryDateTime
                  presentedName
                  serviceCode 
                  methodType 
                  sourceReference
                }
                assignedLocation {
                  location {
                    id
                    name
                    legacyResourceId # ID numérico (ex: 123456) útil para ERPs
                    address {
                      address1
                      city
                      zip
                      provinceCode # UF do depósito
                    }
                  }
                }
              }
            }
          }
        }
      }
        `;

        // Filtro: Pedidos criados  
        // status:open garante que não pega arquivados. 
        // financial_status:paid garante que só pega o que já pagou  
        // financial_status:authorized (pagamento autorizado, mas não capturado)
         //fulfillment_status:unfulfilled → nada foi enviado ainda (normal para faturar antes de expedir).

        let filter = `   `;

            if(lastDateStr)  filter += ` updated_at:>'${lastDateStr}' `;
        
            if(status) filter += `status:${status} `;

            if(financial_status) filter +=  `financial_status:${financial_status} `;
            if(fulfillment_status) filter +=   `fulfillment_status:${fulfillment_status} `;


        let allOrders: requestOrder[] = [];
        let hasNext = true;
        let cursor = null;

        const shopify = await getShopify();


        // Loop para paginação (caso tenha mais de 20 pedidos novos)
        while (hasNext) {
            const variables = {
                cursor: cursor,
                filter: filter
            };

            const response: any = await shopify.request(query, { variables });
            const data = response.data?.orders;

            if (response.errors) {
                console.log(response.errors)
            }

            if (data?.nodes) {
                allOrders.push(...data.nodes);
            }

            hasNext = data?.pageInfo.hasNextPage;
            cursor = data?.pageInfo.endCursor;
        }

        return allOrders

    }


}