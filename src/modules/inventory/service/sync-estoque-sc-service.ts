import { type LogsIntegracao } from "../../../shared/interfaces/logs-integracao.ts";
import { DateService } from "../../../shared/utils/date-service.ts";
import { ConfiguracoesIntegration } from "../../config-integration/configuracoes-integration-repository.ts";
import { LogsIntegration } from "../../logs/log-integration.ts";
import { ErpInventoryRepository } from "../repository/erp-inventory-repository.ts";
import { InventoryForJobRepository } from "../repository/search-inventory-for-job-repository.ts";
import { GetInventoryLevelRequest } from "../request/get-inventory-level-request.ts";
import { DeactivateInventoryService } from "./deactivate-inventory-service.ts";
import { InventoryActivate } from "./inventory-activate-service.ts";
import { UpdateEstoqueService } from "./update-estoque-service.ts";

export class SyncEstoqueScService{
    static async exec (codigo?:number){
   
       const configuracoesIntegration = new ConfiguracoesIntegration();
       const updateEstoqueService = new UpdateEstoqueService();
       const dateService = new DateService();
       const logIntegration = new LogsIntegration();
       const inventoryRepository = new ErpInventoryRepository();
      
        const sucessos: string[] = [];
        const erros: any[] = [];

         try {
   
           const verifiIntegrationConfig = await configuracoesIntegration.select();
   
           if (!verifiIntegrationConfig.length){
              erros.push("integração nao esta configurada corretamente. verificar tabela [configuracoes]")
                return console.warn("integração nao esta configurada corretamente. verificar tabela [configuracoes]")
            }
  
            if (verifiIntegrationConfig[0].enviar_estoque === 'N'){
              erros.push("A integração não esta configurada para enviar estoque.")
              return console.warn("A integração não esta configurada para enviar estoque.")
            }
   
           const arrItems = await inventoryRepository.buscaSaldoRealProdutosSymaSc(codigo);
   
           if (arrItems.length > 0) {
   
             for (const i of arrItems) {
              if(i.trava_estoque == 'S'){
              }else{

                 let log: Omit<LogsIntegracao, "id" | "created_at"> = { action: '', dados_shopify: '', message: '', referencia: 'product', status: 'warning', referencia_id: 0 }
                 const  ESTOQUE  = String(i.ESTOQUE) ;
                 // se o estoque for maior que 0 e estiver ativo na shopify.
                 if(i.is_activate_inventory === 'S' && i.ESTOQUE > 0 ){
   
                   if (parseInt(`${i.ESTOQUE}`) !== parseInt(`${i.ultimo_saldo_enviado}`)) {
                     const resultUpdatesaldo = await updateEstoqueService.post(
                       {
                         erp_sku: Number(i.erp_sku),
                         estoque: parseInt(ESTOQUE) || 0,
                         id_local: String(i.id_local),
                         id_local_shopify: i.id_local_shopify,
                         inventoryItemId: i.inventoryItemId,
                         ultimo_envio_estoque: dateService.obterDataHoraAtual(),
                         variante_id: i.variante_id
                       }
                     );
                     if (!resultUpdatesaldo?.success) {
                      erros.push(`Erro ao tentar atualizar saldo da variante do produto ${i.erp_sku} ${resultUpdatesaldo?.message} no estoque [ SC ].` );
                      log.message = `Erro ao tentar atualizar saldo da variante do produto ${i.erp_sku} ${resultUpdatesaldo?.message} no estoque [ SC ].`;
                       log.status = 'error';
                       await logIntegration.insert(log)
                       console.log(`Erro ao tentar atualizar saldo da variante do produto ${i.erp_sku} no estoque [ SC ].`);
                     } else {
                      sucessos.push(`Atualizado saldo da variante ${i.erp_sku} estoque [ SC ].`)

                       console.log(`Atualizado saldo da variante ${i.erp_sku} estoque [ SC ].`)
                       log.message = `Atualizado saldo da variante ${i.erp_sku} estoque [ SC ].`
                       log.status = 'sucess'
                       await logIntegration.insert(log)
   
                     }
                   }else{
                            sucessos.push(`Saldo atual do produto ${i.erp_sku} é igual ao ultimo enviado  estoque [ SC ].`)
                   }
                 }
   
                   // se o estoque estiver positivo e estiver inativo no setor da shopify.
                 if(i.is_activate_inventory === 'N' && i.ESTOQUE > 0 ){
   
                   if (parseInt(`${i.ESTOQUE}`) !== parseInt(`${i.ultimo_saldo_enviado}`)) {
   
                     console.log("[V] Habilitando produto no estoque SC...")
                    const resultSaldo = await InventoryActivate.activate({
                               available:  Number.parseInt(ESTOQUE)  ,
                               erp_sku: i.erp_sku, 
                               inventoryItemId: i.inventoryItemId,
                               locationId: i.id_local_shopify,
                               onHand: null
                             })
                             if(!resultSaldo?.success){
                               erros.push(`Erro ao tentar atualizar saldo da variante do produto ${i.erp_sku} ${resultSaldo?.data} no estoque [ SC ].`);
                                   log.message = `Erro ao tentar atualizar saldo da variante do produto ${i.erp_sku} ${resultSaldo?.data} no estoque [ SC ].`;
                                  log.status = 'error';
                                  await logIntegration.insert(log)
                             }else{
                            sucessos.push(`Atualizado saldo da variante ${i.erp_sku} estoque [ SC ].`)
                             console.log(`Atualizado saldo da variante ${i.erp_sku} estoque [ SC ].`)
                               log.message = `Atualizado saldo da variante ${i.erp_sku} estoque [ SC ].`
                               log.status = 'sucess'
                             await logIntegration.insert(log)
                             }
                    }else{
                            sucessos.push(`Saldo atual do produto ${i.erp_sku} é igual ao ultimo enviado  estoque [ SC ].`)
                    }
                 }
   
   
                 if(i.is_activate_inventory === 'N' && i.ESTOQUE == 0 ){
                      sucessos.push(String(i.erp_sku))

                   console.log(`[X] Produto ${i.erp_sku} com estoque inativo e saldo zerado. `)
                 }
                 // se o estoque estiver ativo, mas nao tiver saldo, inativa na shopify
                 if(i.is_activate_inventory === 'S' && i.ESTOQUE == 0 ){
                      const resultUpdatesaldo = await updateEstoqueService.post(
                        {
                          erp_sku: Number(i.erp_sku),
                          estoque: Number.parseInt(ESTOQUE)  || 0,
                          id_local: String(i.id_local),
                          id_local_shopify: i.id_local_shopify,
                          inventoryItemId: i.inventoryItemId,
                          ultimo_envio_estoque: dateService.obterDataHoraAtual(),
                          variante_id: i.variante_id
                        }
                      );
   
                   console.log(`[X] saldo: ${i.ESTOQUE} para o produto ${i.erp_sku}, desabilitando no setor de SC na shopify...`)
                    const resultDeactivate =   await  DeactivateInventoryService.exec( i.variante_id, i.id_local_shopify);
   
                      if(resultDeactivate.success){
                      sucessos.push(` saldo: ${i.ESTOQUE} para o produto ${i.erp_sku}, desabilitando no setor de SC na shopify.`)
                               log.status = 'sucess'
                             log.message =resultDeactivate.message; 
                      }else{  
                        erros.push(resultDeactivate.message);
                                log.status = 'error'
                                log.message =resultDeactivate.message; 
                      }
                               await logIntegration.insert(log)
                 }
                 }
   
             }
   
           } else {
            
           console.log(`[X] Não foi encontrado estoque do produto ${codigo} no setor de SC `)
            erros.push(`Não foi encontrado estoque do produto ${codigo} no setor de SC `);
           }
         } catch (e) {
             console.log(e)
               erros.push(e);
               
         } finally {

           await configuracoesIntegration.update({ ultimo_envio_estoque: dateService.obterDataHoraAtual() })
                return { 
                sucess: true,
                message: `Processamento finalizado. Sucessos : ${sucessos.length}, Falhas: ${erros.length}.`,
                enviados: sucessos,
                falhas: erros
              }
          }
     }

     static async postStockSC(erp_sku?:number){
            const resultInventorySC =  await InventoryForJobRepository.buscaSaldoRealProdutosSymaSc(erp_sku);
             const updateEstoqueService = new UpdateEstoqueService();
        
              if(resultInventorySC.length > 0 ){
                for(const inventorySystem of resultInventorySC){
        
                        const resultInventoryLevelShopify = await GetInventoryLevelRequest.getInventoryLevelVariant( inventorySystem.variante_id, inventorySystem.id_local_shopify) ;

                        const inventoryLevel =resultInventoryLevelShopify.data?.productVariant?.inventoryItem?.inventoryLevel;
                        

                          const ESTOQUE = Number( Math.round(inventorySystem.ESTOQUE)); 


                          /// ATIVA O INVENTARIO SE ESTIVER COM O INVENTARIO DESATIVADO 
                          if(!inventoryLevel ){
                            if( ESTOQUE > 0){
                              console.log(`[V] Saldo do sistema ${ ESTOQUE} produto ${inventorySystem.erp_sku}, ativando e enviando estoque [ SC ]`)
                                const resultSaldo = await InventoryActivate.activate({
                                      available:   ESTOQUE   ,
                                      erp_sku: inventorySystem.erp_sku, 
                                      inventoryItemId: inventorySystem.inventoryItemId,
                                      locationId: inventorySystem.id_local_shopify,
                                      onHand: null
                                    })
                                              await updateEstoqueService.post({ erp_sku: inventorySystem.erp_sku,
                                                estoque:   ESTOQUE,
                                                id_local: inventorySystem.id_local,
                                                id_local_shopify: inventorySystem.id_local_shopify,
                                                inventoryItemId: inventorySystem.inventoryItemId,
                                                ultimo_envio_estoque: inventorySystem.ultimo_envio_estoque,
                                                variante_id:inventorySystem.variante_id
                                              })
                                }else{
                                        console.log(`[X] Saldo do sistema ${ESTOQUE} produto ${inventorySystem.erp_sku} [ SC ] e nenhum saldo disponivel na shopify, nenhuma ação será executada.`)
                                }
          
                          }else{
                            // VERIFICA SE O ARRAY COM AS QUANTIDADES ESTA PREENCHIDO NA SHOPIFY .                      
                                if(inventoryLevel.quantities && inventoryLevel.quantities.length > 0  ){
                                  // COMPARA A QUANTIDADE NA SHOPIFY COM O SALDO DO SISTEMA.
                                  if(inventoryLevel.quantities[0].quantity !=  ESTOQUE  ){
                                    
                                        if( ESTOQUE  == 0 ){
                                      
                                            console.log(`[X] Saldo do sistema ${ESTOQUE} produto ${inventorySystem.erp_sku} [ SC ], desativar estoque na shopify `)
                                            if(inventoryLevel.quantities[0].quantity > 0 ){
                                              await updateEstoqueService.post({ erp_sku: inventorySystem.erp_sku,
                                                                            estoque: ESTOQUE,
                                                                              id_local: inventorySystem.id_local,
                                                                              id_local_shopify: inventorySystem.id_local_shopify,
                                                                              inventoryItemId: inventorySystem.inventoryItemId,
                                                                              ultimo_envio_estoque: inventorySystem.ultimo_envio_estoque,
                                                                              variante_id:inventorySystem.variante_id
                                                                            })
                                                const resultDeactivate =  await  DeactivateInventoryService.exec( inventorySystem.variante_id, inventorySystem.id_local_shopify);
                                                console.log(resultDeactivate)
                                              }else{
                                                const resultDeactivate =  await  DeactivateInventoryService.exec( inventorySystem.variante_id, inventorySystem.id_local_shopify);
                                                console.log(resultDeactivate)
                                              }
        
                                        }else{
                                            // envia o estoque para shopify
                                          console.log(`[X] Saldo da shopify é diferente do saldo do sistema |  ${inventoryLevel.quantities[0].quantity} != ${ESTOQUE}`)
                                            console.log(`[V] Enviando novo saldo ${ESTOQUE} produto ${inventorySystem.erp_sku} para shopify [ SC ]`)
                                            const resultUpdateEstoqueService =  await updateEstoqueService.post({ erp_sku: inventorySystem.erp_sku,
                                                                            estoque: ESTOQUE,
                                                                              id_local: inventorySystem.id_local,
                                                                              id_local_shopify: inventorySystem.id_local_shopify,
                                                                              inventoryItemId: inventorySystem.inventoryItemId,
                                                                              ultimo_envio_estoque: inventorySystem.ultimo_envio_estoque,
                                                                              variante_id:inventorySystem.variante_id
                                                                            })
                                            console.log(resultUpdateEstoqueService)                                 
                                            }
                                  }  else{
                                      // o saldo da shopify é igual ao do sitema
        
                                      // verificando se o saldo do sistema esta zerado
                                      if( ESTOQUE  == 0 ){
                                        console.log(`[X] Saldo do sistema ${ESTOQUE} produto ${inventorySystem.erp_sku} [ SC ] , desativar estoque na shopify `)
                                        if(inventoryLevel.quantities[0].quantity > 0 ){
                                              await updateEstoqueService.post({ erp_sku: inventorySystem.erp_sku,
                                                                            estoque:  ESTOQUE,
                                                                              id_local: inventorySystem.id_local,
                                                                              id_local_shopify: inventorySystem.id_local_shopify,
                                                                              inventoryItemId: inventorySystem.inventoryItemId,
                                                                              ultimo_envio_estoque: inventorySystem.ultimo_envio_estoque,
                                                                              variante_id:inventorySystem.variante_id
                                                                            })
                                                const resultDeactivate =  await  DeactivateInventoryService.exec( inventorySystem.variante_id, inventorySystem.id_local_shopify);
                                                console.log(resultDeactivate)
                                              }else{
                                                const resultDeactivate =  await  DeactivateInventoryService.exec( inventorySystem.variante_id, inventorySystem.id_local_shopify);
                                                console.log(resultDeactivate)
                                              }
                                      }
                                      if( ESTOQUE  == inventoryLevel.quantities[0].quantity ){
                                        console.log(`[X] Saldo do sistema ${ESTOQUE} produto ${inventorySystem.erp_sku} [ SC ] é igual ao saldo da shopify, nenhuma ação será executada.`)
                                      }
        
                                  } 
                                } else{
                                  console.log(`[X] Inventory level produto ${inventorySystem.erp_sku} [ SC ] vazio na shopify.`)
                                }
                          }
                        
                  
        
                }
              }else{
                console.log("[X] Nenhum estoque disponivel para envio para setor da [ SC ]");
              }
     }
}