
import cron from 'node-cron';
import { ReceiveOrderService } from './services/receive-order-service.ts';
import {type GetOrdersInput } from './types/type-input-order-request.ts';

export class JobPedido {
    private  receiveOrderService:ReceiveOrderService
    
    constructor(receiveOrderService:ReceiveOrderService){
        this.receiveOrderService = receiveOrderService; 
    }

    async job(configCron:string, inputRequest: GetOrdersInput, seller:number, priceTable:number) {

         let inExec = false;
         console.log('[V] Tarefa de recebimento de pedidos agendada com sucesso.')

        cron.schedule(configCron, async () => {
                if(inExec) {
                    console.log("[X] Tarefa de recebimento de pedidos ainda em execução.")
                    return
                  }

            try{
                inExec = true;

                    console.log('Executando tarefa [recebimento pedidos] ...')
                    await this.receiveOrderService.syncOrder(inputRequest, seller, priceTable );
                     
            }catch(e){
                console.log(e);
                }finally{
                inExec = false;
            }
      
        });
    }


}