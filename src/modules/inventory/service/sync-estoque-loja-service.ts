import { type LogsIntegracao } from "../../../shared/interfaces/logs-integracao.ts";
import { DateService } from "../../../shared/utils/date-service.ts";
import { ConfiguracoesIntegration } from "../../config-integration/configuracoes-integration-repository.ts";
import { LogsIntegration } from "../../logs/log-integration.ts";
import { ErpInventoryRepository } from "../repository/erp-inventory-repository.ts";
import { InventoryForJobRepository } from "../repository/search-inventory-for-job-repository.ts";
import { GetInventoryLevelRequest } from "../request/get-inventory-level-request.ts";
import { DeactivateInventoryService } from "../service/deactivate-inventory-service.ts";
import { InventoryActivate } from "../service/inventory-activate-service.ts";
import { UpdateEstoqueService } from "../service/update-estoque-service.ts";

 export class SyncEstoqueLojaService{

 static async exec(codigo?:number) {

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
          erros.push("integração nao esta configurada corretamente. verificar tabela [configuracoes]");
           return console.log("integração nao esta configurada corretamente. verificar tabela [configuracoes]")
         }

        if (verifiIntegrationConfig[0].enviar_estoque === 'N'){
              erros.push("A integração não esta configurada para enviar estoque.")
              return console.warn("A integração não esta configurada para enviar estoque.")
        }

        const arrItems = await inventoryRepository.buscaSaldoRealProdutosLoja(codigo);


        if (arrItems.length > 0) {

          for (const i of arrItems) {
            
            let log: Omit<LogsIntegracao, "id" | "created_at"> = { action: '', dados_shopify: '', message: '', referencia: 'product', status: 'warning', referencia_id: 0 }
              const  ESTOQUE  = String(i.ESTOQUE) ;
              if(i.trava_estoque == 'S'){
                         log.status = 'sucess'
                          log.message = `Produto ${i.erp_sku} com estoque travado no setor ${i.setor}.`; 
                console.log(log.message)
                 
                          sucessos.push(`Produto ${i.erp_sku} com estoque travado no setor ${i.setor}.`)

              }else{

              if(i.is_activate_inventory === 'S' && i.ESTOQUE > 0 ){
                if (parseInt(`${i.ESTOQUE}`) !== parseInt(`${i.ultimo_saldo_enviado}`)) {

                  const valor = `${i.ESTOQUE}`;
                  const resultUpdatesaldo = await updateEstoqueService.post(
                    {
                      erp_sku: Number(i.erp_sku),
                      estoque: parseInt(valor) || 0,
                      id_local: String(i.id_local),
                      id_local_shopify: i.id_local_shopify,
                      inventoryItemId: i.inventoryItemId,
                      ultimo_envio_estoque: dateService.obterDataHoraAtual(),
                      variante_id: i.variante_id
                    }
                  );
                  if (!resultUpdatesaldo?.success) {
                      erros.push( `Erro ao tentar atualizar saldo da variante do produto ${i.erp_sku} ${resultUpdatesaldo?.message} no estoque [ LOJA ].` );
                    log.message = `Erro ao tentar atualizar saldo da variante do produto ${i.erp_sku} ${resultUpdatesaldo?.message} no estoque [ LOJA ].`;
                    log.status = 'error';
                    await logIntegration.insert(log)
                    console.log(`Erro ao tentar atualizar saldo da variante do produto ${i.erp_sku} estoque [ LOJA ].`);
                  } else {
                      sucessos.push(`Atualizado saldo da variante ${i.erp_sku} estoque [ LOJA ].`)
                    console.log(`Atualizado saldo da variante ${i.erp_sku} estoque [ LOJA ].`)
                    log.message = `Atualizado saldo da variante ${i.erp_sku} estoque [ LOJA ].`
                    log.status = 'sucess'
                    await logIntegration.insert(log)
                  }
                } else {
                    sucessos.push(`Saldo atual do produto ${i.erp_sku} é igual ao ultimo enviado  estoque [ LOJA ].`)
                }
              }
                 // se o estoque estiver positivo e estiver inativo no setor da shopify.
              if(i.is_activate_inventory === 'N' && i.ESTOQUE > 0 ){
                         console.log("[V] Habilitando produto no estoque LOJA...")
                 const resultSaldo = await InventoryActivate.activate({
                            available:  Number.parseInt(ESTOQUE)  ,
                            erp_sku: i.erp_sku, 
                            inventoryItemId: i.inventoryItemId,
                            locationId: i.id_local_shopify,
                            onHand: null
                          })
                          if(!resultSaldo?.success){
                             erros.push( `Erro ao tentar atualizar saldo da variante do produto ${i.erp_sku} ${resultSaldo?.data} no estoque [ LOJA ].` );
                                log.message = `Erro ao tentar atualizar saldo da variante do produto ${i.erp_sku} ${resultSaldo?.data} no estoque [ LOJA ].`;
                            log.status = 'error';
                            await logIntegration.insert(log)
                          }else{
                         sucessos.push(`Atualizado saldo da variante ${i.erp_sku} estoque [ LOJA ].`)

                             console.log(`Atualizado saldo da variante ${i.erp_sku} estoque [ LOJA ].`)
                            log.message = `Atualizado saldo da variante ${i.erp_sku} estoque [ LOJA ].`
                            log.status = 'sucess'
                          await logIntegration.insert(log)
                          }
              }

              if(i.is_activate_inventory === 'N' && i.ESTOQUE == 0 ){
                         erros.push(`[X] Produto ${i.erp_sku} com estoque inativo e saldo zerado. `)
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

                console.log(`[X] saldo: ${i.ESTOQUE} para o produto ${i.erp_sku}, desabilitando no setor de LOJA na shopify...`)
               const resultDeactivate =  await  DeactivateInventoryService.exec( i.variante_id, i.id_local_shopify);

                   if(resultDeactivate.success){
                            log.status = 'sucess'
                          log.message =resultDeactivate.message; 
                      sucessos.push(`saldo: ${i.ESTOQUE} para o produto ${i.erp_sku}, desabilitando no setor de LOJA na shopify...`)

                   }else{

                             log.status = 'error'
                             log.message =resultDeactivate.message; 
                      erros.push(resultDeactivate.message);

                   }
                            await logIntegration.insert(log)

              }
              }
          
            }

        } else {
          console.log(`[X] Não foi encontrado estoque do produto ${codigo} no setor LOJA `)
          erros.push(`Não foi encontrado estoque do produto ${codigo} no setor LOJA `);
     
        }

      } catch (e) {
          erros.push(e);
           console.log(e)

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



    /**
     * Função especifica para itens que já foram enviados anteriormente.
     * @param codigo 
     * @returns 
     */
  static async updateInventoryLOJA(codigo?:number) {

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
          erros.push("integração nao esta configurada corretamente. verificar tabela [configuracoes]");
           return console.log("integração nao esta configurada corretamente. verificar tabela [configuracoes]")
         }

        if (verifiIntegrationConfig[0].enviar_estoque === 'N'){
              erros.push("A integração não esta configurada para enviar estoque.")
              return console.warn("A integração não esta configurada para enviar estoque.")
        }

        const arrItems = await inventoryRepository.buscaSaldoRealProdutosLoja(codigo);


        if (arrItems.length > 0) {

            console.log(`[V] Verificando estoque LOJA ${arrItems.length} produtos encontrados.`)
            for (const i of arrItems) {
              
            let log: Omit<LogsIntegracao, "id" | "created_at"> = { action: '', dados_shopify: '', message: '', referencia: 'product', status: 'warning', referencia_id: 0 }
              const  ESTOQUE  = String(i.ESTOQUE) ;

              if(i.is_activate_inventory === 'S' && i.ESTOQUE > 0 ){
                if (parseInt(`${i.ESTOQUE}`) !== parseInt(`${i.ultimo_saldo_enviado}`)) {

                  const valor = `${i.ESTOQUE}`;
                  const resultUpdatesaldo = await updateEstoqueService.post(
                    {
                      erp_sku: Number(i.erp_sku),
                      estoque: parseInt(valor) || 0,
                      id_local: String(i.id_local),
                      id_local_shopify: i.id_local_shopify,
                      inventoryItemId: i.inventoryItemId,
                      ultimo_envio_estoque: dateService.obterDataHoraAtual(),
                      variante_id: i.variante_id
                    }
                  );
                  if (!resultUpdatesaldo?.success) {
                      erros.push( `Erro ao tentar atualizar saldo da variante do produto ${i.erp_sku} ${resultUpdatesaldo?.message} no estoque [ LOJA ].` );
                    log.message = `Erro ao tentar atualizar saldo da variante do produto ${i.erp_sku} ${resultUpdatesaldo?.message} no estoque [ LOJA ].`;
                    log.status = 'error';
                    await logIntegration.insert(log)
                    console.log(`Erro ao tentar atualizar saldo da variante do produto ${i.erp_sku} estoque [ LOJA ].`);
                  } else {
                      sucessos.push(`Atualizado saldo da variante ${i.erp_sku} estoque [ LOJA ].`)
                    console.log(`Atualizado saldo da variante ${i.erp_sku} estoque [ LOJA ].`)
                    log.message = `Atualizado saldo da variante ${i.erp_sku} estoque [ LOJA ].`
                    log.status = 'sucess'
                    await logIntegration.insert(log)
                  }
                } else {
                    sucessos.push(`Saldo atual do produto ${i.erp_sku} é igual ao ultimo enviado  estoque [ LOJA ].`)
                }
              }
                 // se o estoque estiver positivo e estiver inativo no setor da shopify.
              if(i.is_activate_inventory === 'N' && i.ESTOQUE > 0 ){
                         console.log("[V] Habilitando produto no estoque LOJA...")
                 const resultSaldo = await InventoryActivate.activate({
                            available:  Number.parseInt(ESTOQUE)  ,
                            erp_sku: i.erp_sku, 
                            inventoryItemId: i.inventoryItemId,
                            locationId: i.id_local_shopify,
                            onHand: null
                          })
                          if(!resultSaldo?.success){
                             erros.push( `Erro ao tentar atualizar saldo da variante do produto ${i.erp_sku} ${resultSaldo?.data} no estoque [ LOJA ].` );
                                log.message = `Erro ao tentar atualizar saldo da variante do produto ${i.erp_sku} ${resultSaldo?.data} no estoque [ LOJA ].`;
                            log.status = 'error';
                            await logIntegration.insert(log)
                          }else{
                         sucessos.push(`Atualizado saldo da variante ${i.erp_sku} estoque [ LOJA ].`)

                             console.log(`Atualizado saldo da variante ${i.erp_sku} estoque [ LOJA ].`)
                            log.message = `Atualizado saldo da variante ${i.erp_sku} estoque [ LOJA ].`
                            log.status = 'sucess'
                          await logIntegration.insert(log)
                          }
              }

              if(i.is_activate_inventory === 'N' && i.ESTOQUE == 0 ){
                         erros.push(`[X] Produto ${i.erp_sku} com estoque inativo e saldo zerado. `)
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

                console.log(`[X] saldo: ${i.ESTOQUE} para o produto ${i.erp_sku}, desabilitando no setor de LOJA na shopify...`)
               const resultDeactivate =  await  DeactivateInventoryService.exec( i.variante_id, i.id_local_shopify);

                   if(resultDeactivate.success){
                    
                            log.status = 'sucess'
                          log.message =resultDeactivate.message; 
                      sucessos.push(`saldo: ${i.ESTOQUE} para o produto ${i.erp_sku}, desabilitando no setor de LOJA na shopify...`)

                   }else{

                             log.status = 'error'
                             log.message =resultDeactivate.message; 
                      erros.push(resultDeactivate.message);

                   }
                            await logIntegration.insert(log)

              }
          
            }

        } else {
          console.log(`[X] Não foi encontrado estoque do produto ${codigo} no setor LOJA `)
          erros.push(`Não foi encontrado estoque do produto ${codigo} no setor LOJA `);
     
        }

      } catch (e) {
          erros.push(e);
           console.log(e)

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

  static async postStockLoja(erp_sku?:number){
          const updateEstoqueService = new UpdateEstoqueService();

              const resultInventorySC =  await InventoryForJobRepository.buscaSaldoRealProdutosLoja(erp_sku);
        
              if(resultInventorySC.length > 0 ){
        
                for(const inventorySystem of resultInventorySC){
                    if(inventorySystem.trava_estoque == 'S'){
                console.log(`Produto ${inventorySystem.erp_sku} com estoque travado no setor ${inventorySystem.setor}.`)
                    }else{

                        const resultInventoryLevelShopify = await GetInventoryLevelRequest.getInventoryLevelVariant( inventorySystem.variante_id, inventorySystem.id_local_shopify) ;
                        const inventoryLevel =resultInventoryLevelShopify.data?.productVariant?.inventoryItem?.inventoryLevel;
                  
                          const ESTOQUE = Number( Math.round(inventorySystem.ESTOQUE)); 

                          /// ATIVA O INVENTARIO SE ESTIVER COM O INVENTARIO DESATIVADO 
                          if(!inventoryLevel ){
                            if( ESTOQUE > 0){
                              console.log(`[V] Saldo do sistema ${ESTOQUE} produto ${inventorySystem.erp_sku}, ativando e enviando estoque [ LOJA ]`)
                                const resultSaldo = await InventoryActivate.activate({
                                      available: ESTOQUE ,
                                      erp_sku: inventorySystem.erp_sku, 
                                      inventoryItemId: inventorySystem.inventoryItemId,
                                      locationId: inventorySystem.id_local_shopify,
                                      onHand: null
                                    })
                                              await updateEstoqueService.post({ erp_sku: inventorySystem.erp_sku,
                                                estoque: ESTOQUE,
                                                id_local: inventorySystem.id_local,
                                                id_local_shopify: inventorySystem.id_local_shopify,
                                                inventoryItemId: inventorySystem.inventoryItemId,
                                                ultimo_envio_estoque: inventorySystem.ultimo_envio_estoque,
                                                variante_id:inventorySystem.variante_id
                                              })
                                }else{
                                        console.log(`[X] Saldo do sistema ${ESTOQUE} produto ${inventorySystem.erp_sku} [ LOJA ] e nenhum saldo disponivel na shopify, nenhuma ação será executada.`)
                                }
          
                          }else{
                            // VERIFICA SE O ARRAY COM AS QUANTIDADES ESTA PREENCHIDO NA SHOPIFY .                      
                                if(inventoryLevel.quantities && inventoryLevel.quantities.length > 0  ){
                                  // COMPARA A QUANTIDADE NA SHOPIFY COM O SALDO DO SISTEMA.
                                  if(inventoryLevel.quantities[0].quantity != ESTOQUE ){
                                    
                                        if(Number(inventorySystem.ESTOQUE) == 0 ){
                                      
                                            console.log(`[X] Saldo do sistema ${ESTOQUE} produto ${inventorySystem.erp_sku} [ LOJA ], desativar estoque na shopify `)
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
                                            console.log(`[V] Enviando novo saldo ${ESTOQUE} produto ${inventorySystem.erp_sku} para shopify [ LOJA ]`)
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
                                      if( ESTOQUE == 0 ){
                                        console.log(`[X] Saldo do sistema ${ ESTOQUE} produto ${inventorySystem.erp_sku} [ LOJA ] , desativar estoque na shopify `)
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
                                        console.log(`[X] Saldo do sistema ${ ESTOQUE} produto ${inventorySystem.erp_sku} [ LOJA ] é igual ao saldo da shopify, nenhuma ação será executada.`)
                                      }
        
                                  } 
                                } else{
                                  console.log(`[X] Inventory level produto ${inventorySystem.erp_sku} [ LOJA ] vazio na shopify.`)
                                }
                          }
        
                    }
                }
        
              }else{
                console.log("[X] Nenhum estoque disponivel para envio para setor da [ LOJA ]");
              }
      
  }
}