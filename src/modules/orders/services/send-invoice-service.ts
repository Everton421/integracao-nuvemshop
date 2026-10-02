import { conn2, database_api } from "../../../database/database-connection.ts";
import { getShopify } from "../../../shared/api/api.ts";

export class SendInvoiceService {


    static async sendInvoice(order_id: string, numero_nfe: string, chave_nfe: string ) {
        const shopify = await getShopify();
     const   database = `\`${database_api}\``
  
        const mutationMetafields = `
                mutation UpdateOrderMeta($input: OrderInput!) {
                    orderUpdate(input: $input) {
                        order { id }
                        userErrors { field message }
                    }
                }
            `;

         const { data,errors } =   await shopify.request(mutationMetafields, {
                variables: {
                    input: {
                        id: order_id,
                        tags: ["Pedido faturado", `NFE N° ${numero_nfe}`],
                        metafields: [
                            { namespace: "custom", key: "numero_nfe", type: "single_line_text_field", value: String(numero_nfe) },
                            { namespace: "custom", key: "chave_nfe", type: "single_line_text_field", value: String(chave_nfe) }
                        ]
                    }
                }
            });
        
            if(errors){
                console.log(errors)
            }
            if(data){
             const updateSql = ` UPDATE ${database}.pedidos set  
                numero_nf = '${numero_nfe}',
                chave_nf = '${chave_nfe}'
                where shopify_order_id = '${order_id}';
            `
             const result =  await conn2.query(updateSql)
            }

        }
        }
    