import cron from 'node-cron';
import { DateService } from "../../../shared/utils/date-service.ts";
import { ConfiguracoesIntegration } from "../../config-integration/configuracoes-integration-repository.ts";
import { SyncEstoqueScService } from "../service/sync-estoque-sc-service.ts";
import { UpdateEstoqueService } from '../service/update-estoque-service.ts';
import { InventoryForJobRepository } from '../repository/search-inventory-for-job-repository.ts';
import { GetInventoryLevelRequest } from '../request/get-inventory-level-request.ts';
import { InventoryActivate } from '../service/inventory-activate-service.ts';
import { DeactivateInventoryService } from '../service/deactivate-inventory-service.ts';

export class JobEstoqueSc {

  static async job(codigo?:number) {

    const configuracoesIntegration = new ConfiguracoesIntegration();
    const dateService = new DateService();

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

          await SyncEstoqueScService.exec(codigo);

        } catch (e) {
          console.log(e)
        } finally {
          inExec = false;
          await configuracoesIntegration.update({ ultimo_envio_estoque: dateService.obterDataHoraAtual() })
        }
    });
  }


    static async newJob( erp_sku?:number){
             const configuracoesIntegration = new ConfiguracoesIntegration();
             const dateService = new DateService();
             const updateEstoqueService = new UpdateEstoqueService();
  
      const configCron = process.env.ENVIAR_ESTOQUE;
  
        if (!configCron) {
          return console.log("é necessario configurar a variavel ENVIAR_ESTOQUE com a expressao cron. ")
        }
        let inExec = false;
      cron.schedule(configCron, async () => {

            try{

              
              if (inExec) {
                inExec = false;
                console.log(`[X] tarefa de envio [estoque SC] ainda em execução.`)
                return
              }
              inExec = true;

                     await SyncEstoqueScService.postStockSC()
            }catch( e ){
              console.log(e)
            }finally{
            inExec = false;
              await configuracoesIntegration.update({ ultimo_envio_estoque: dateService.obterDataHoraAtual() })
            }
      }) 
       
    }
  }
