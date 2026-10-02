
import { conn2, database_api, db_vendas } from '../../../database/database-connection.ts';
import { SendInvoiceService } from '../services/send-invoice-service.ts';

type resultInvoice = { 
    erp_order_id:string,
   CHAVE_NFE:string 
   shopify_order_id:string 
   NUMERO_NF:string 
}
export class JobSendInvoice {
    
  static async job(){

             const   database = `\`${database_api}\``
          
     const sqlInvoices = ` SELECT 
                 p.erp_order_id,
                 nf.CHAVE_NFE,
                 p.shopify_order_id,
                 nf.NUMERO_NF,
                 
                 p.shopify_order_number
                 FROM ${database}.pedidos p 
                 join ${db_vendas}.cad_nf nf on nf.pedido = p.erp_order_id
                 where nf.CHAVE_NFE <> '' and nf.CHAVE_NFE IS NOT NUll AND nf.SITUACAO_NFE = 'A' 
               and ( p.numero_nf is null OR p.numero_nf = '' ) and (p.chave_nf is null OR p.chave_nf = '')
                  
                         `
                         const [arrResultinvoice] = await conn2.query(sqlInvoices);
                         const resultinvoice = arrResultinvoice as resultInvoice[];
                         if(resultinvoice.length > 0 ){
                             console.log(`[V] ${resultinvoice.length} Notas encontradas.`)
                             
                             for( const invoice of resultinvoice){
                                        await SendInvoiceService.sendInvoice(invoice.shopify_order_id, invoice.NUMERO_NF, invoice.CHAVE_NFE ) 
                                }
                              
                         }else{
                             console.log(`[X] Nenhuma nota pendente de envio`)
 
                         }
                 

  } 

}