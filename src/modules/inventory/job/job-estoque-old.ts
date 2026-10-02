import { ConfiguracoesIntegration } from "../../config-integration/configuracoes-integration-repository.ts";
import { ErpInventoryRepository } from "../repository/erp-inventory-repository.ts";
import { UpdateEstoqueService } from "../service/update-estoque-service.ts";
import { LogsIntegration } from "../../logs/log-integration.ts";
import { type LogsIntegracao } from "../../../shared/interfaces/logs-integracao.ts";
import { DateService } from "../../../shared/utils/date-service.ts";

import cron from 'node-cron';
import { InventoryActivate } from "../service/inventory-activate-service.ts";
import { DeactivateInventoryService } from "../service/deactivate-inventory-service.ts";

export class JobEstoque {

  async jobEstoqueSc() {

    const configuracoesIntegration = new ConfiguracoesIntegration();

    const updateEstoqueService = new UpdateEstoqueService();
    const dateService = new DateService();
    const logIntegration = new LogsIntegration();
    const inventoryRepository = new ErpInventoryRepository();


    const configCron = process.env.ENVIAR_ESTOQUE;

    if (!configCron) {
      return console.log("é necessario configurar a variavel ENVIAR_ESTOQUE com a expressao cron. ")
    }
    let inExec = false;
      cron.schedule(configCron, async () => {
      try {

        if (inExec) {
          inExec = false;
          console.log(`[X] tarefa de envio [estoque SC] ainda em execução.`)
          return
        }
        inExec = true;

        console.log('Executando tarefa [estoque SC] ...')

        const verifiIntegrationConfig = await configuracoesIntegration.select();

        if (!verifiIntegrationConfig.length) return console.log("integração nao esta configurada corretamente. verificar tabela [configuracoes]")

        if (verifiIntegrationConfig[0].enviar_estoque === 'N') return console.log("A integração não esta configurada para enviar estoque.")


        const arrItems = await inventoryRepository.buscaSaldoRealProdutosSymaSc();


        if (arrItems.length > 0) {

          for (const i of arrItems) {

              let log: Omit<LogsIntegracao, "id" | "created_at"> = { action: '', dados_shopify: '', message: '', referencia: 'product', status: 'warning', referencia_id: 0 }
              const  ESTOQUE  = String(i.ESTOQUE) ;
              // se o estoque for maior que 0 e estiver ativo na shopify.
              if(i.is_activate_inventory === 'S' && i.ESTOQUE > 0 ){

                if (parseInt(`${i.ESTOQUE}`) !== parseInt(`${i.ultimo_saldo_enviado}`)) {
                  console.log("[ aguardando...]")

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
                    log.message = `Erro ao tentar atualizar saldo da variante do produto ${i.erp_sku} ${resultUpdatesaldo?.message} no estoque [ SC ].`;
                    log.status = 'error';
                    await logIntegration.insert(log)
                    console.log(`Erro ao tentar atualizar saldo da variante do produto ${i.erp_sku} no estoque [ SC ].`);
                  } else {
                    console.log(`Atualizado saldo da variante ${i.erp_sku} estoque [ SC ].`)
                    log.message = `Atualizado saldo da variante ${i.erp_sku} estoque [ SC ].`
                    log.status = 'sucess'
                    await logIntegration.insert(log)

                  }
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
                                log.message = `Erro ao tentar atualizar saldo da variante do produto ${i.erp_sku} ${resultSaldo?.data} no estoque [ SC ].`;
                            log.status = 'error';
                            await logIntegration.insert(log)
                          }else{
                             console.log(`Atualizado saldo da variante ${i.erp_sku} estoque [ SC ].`)
                            log.message = `Atualizado saldo da variante ${i.erp_sku} estoque [ SC ].`
                            log.status = 'sucess'
                          await logIntegration.insert(log)
                          }
                 }
              }


              if(i.is_activate_inventory === 'N' && i.ESTOQUE == 0 ){
                console.log(`[X] Produto ${i.erp_sku} inativo e com saldo zerado. `)
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
                await  DeactivateInventoryService.exec( i.variante_id, i.id_local_shopify);
              }

          }

        } else {
          console.log('nenhuma variante disponivel para envio de estoque no momento')
        }
      } catch (e) {
        console.log(e)
      } finally {

        inExec = false;
        await configuracoesIntegration.update({ ultimo_envio_estoque: dateService.obterDataHoraAtual() })

      }
     });
  }



  async jobEstoqueLoja() {

    const configuracoesIntegration = new ConfiguracoesIntegration();
    const updateEstoqueService = new UpdateEstoqueService();
    const dateService = new DateService();
    const logIntegration = new LogsIntegration();

        const inventoryRepository = new ErpInventoryRepository();


    const configCron = process.env.ENVIAR_ESTOQUE;

    if (!configCron) {
      return console.log("é necessario configurar a variavel ENVIAR_ESTOQUE com a expressao cron. ")
    }
    let inExec = false;

   cron.schedule(configCron, async () => {

      try {
        if (inExec) {
          console.log(`[X] tarefa de envio [estoque loja] ainda em execução.`)
          return
        }
        inExec = true;
        console.log('Executando tarefa [estoque loja] ...')

        const verifiIntegrationConfig = await configuracoesIntegration.select();

        if (!verifiIntegrationConfig.length) return console.log("integração nao esta configurada corretamente. verificar tabela [configuracoes]")

        if (verifiIntegrationConfig[0].enviar_estoque === 'N') return console.log("A integração não esta configurada para enviar estoque.")


        const arrItems = await inventoryRepository.buscaSaldoRealProdutosLoja();


        if (arrItems.length > 0) {

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
                    log.message = `Erro ao tentar atualizar saldo da variante do produto ${i.erp_sku} ${resultUpdatesaldo?.message} no estoque [ LOJA ].`;
                    log.status = 'error';
                    await logIntegration.insert(log)
                    console.log(`Erro ao tentar atualizar saldo da variante do produto ${i.erp_sku} estoque [ LOJA ].`);
                  } else {
                    console.log(`Atualizado saldo da variante ${i.erp_sku} estoque [ LOJA ].`)
                    log.message = `Atualizado saldo da variante ${i.erp_sku} estoque [ LOJA ].`
                    log.status = 'sucess'
                    await logIntegration.insert(log)
                  }
                } else {
                  // console.log(`Não ouve atualização do saldo da variante ${i.erp_sku} estoque [ LOJA ].`)
                  //  log.message = `Não ouve atualização do saldo da variante ${i.erp_sku} estoque [ LOJA ].`
                  //   log.status = 'sucess' 
                  //   console.log(` Não ouve atualização do saldo da variante ${i.erp_sku} estoque [ LOJA ].`)
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
                                log.message = `Erro ao tentar atualizar saldo da variante do produto ${i.erp_sku} ${resultSaldo?.data} no estoque [ LOJA ].`;
                            log.status = 'error';
                            await logIntegration.insert(log)
                          }else{
                             console.log(`Atualizado saldo da variante ${i.erp_sku} estoque [ LOJA ].`)
                            log.message = `Atualizado saldo da variante ${i.erp_sku} estoque [ LOJA ].`
                            log.status = 'sucess'
                          await logIntegration.insert(log)
                          }
              }

              if(i.is_activate_inventory === 'N' && i.ESTOQUE == 0 ){
                console.log(`[X] Produto ${i.erp_sku} inativo e com saldo zerado. `)
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
                await  DeactivateInventoryService.exec( i.variante_id, i.id_local_shopify);
              }
          
            }

        } else {
          console.log('nenhuma variante disponivel para envio de estoque no momento')
        }

      } catch (e) {

      } finally {
        await configuracoesIntegration.update({ ultimo_envio_estoque: dateService.obterDataHoraAtual() })
        inExec = false;

      }
    });
  }
}

