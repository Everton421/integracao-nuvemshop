
//const cron = require('node-cron');
import cron from 'node-cron';
import { ConfiguracoesIntegration } from '../../config-integration/configuracoes-integration-repository.ts';
import { GetPedidosService } from '../services/get-orders-service.ts';
import { DateService } from '../../../shared/utils/date-service.ts';
import { JobSendInvoice } from './job-send-invoice.ts';

export class JobPedido {

    async job() {

        const configuracoesIntegration = new ConfiguracoesIntegration();
        const getPedidosService = new GetPedidosService();
        const dateService = new DateService();


        const configCron = process.env.IMPORTAR_PEDIDOS;

        if (!configCron) {
            return console.log("é necessario configurar a variavel IMPORTAR_PEDIDOS com a expressao cron. ")
         }
            let inExec = false;

        cron.schedule(configCron, async () => {
                if(inExec) {
                    console.log("[X] Tarefa de recebimento de pedidos ainda em execução.")
                    return
                }

            try{
                inExec = true;

                const verifiIntegrationConfig = await configuracoesIntegration.select();
                    if (!verifiIntegrationConfig.length) {
                        return console.log("integração nao esta configurada corretamente. verificar tabela [configuracoes]")
                    }

                    const { importar_pedidos } = verifiIntegrationConfig[0];
                    if (importar_pedidos === 'N') {
                        return console.log("integração nao esta configurada para receber pedidos")
                    }

                    console.log('Executando tarefa [recebimento pedidos] ...')

                    // consulta os pedido no intervalo de dois dias
                    await getPedidosService.getPedidos(dateService.obterDataDiasAtraso(2));

                     
            }catch(e){
                console.log(e);
                }finally{
                inExec = false;
            }

            console.log(`[V] Iniciando envio das notas dos pedidos...`)
           await JobSendInvoice.job();
            console.log(`[V] Fim do envio das notas...`)

      
        });
    }


}