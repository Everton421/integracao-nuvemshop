import cron from 'node-cron';
import { SyncInventoryPrice } from '../commands/sync-inventory-script-price-command.ts';
import { SyncInventoryStock } from '../commands/sync-inventory-stock-command.ts';

export class InventoryJob {
    private syncInventoryPrice:SyncInventoryPrice
    private syncInventoryStock : SyncInventoryStock

    constructor(
        syncInventoryPrice: SyncInventoryPrice, syncInventoryStock : SyncInventoryStock
    ){  
            this.syncInventoryPrice=syncInventoryPrice 
            this.syncInventoryStock=syncInventoryStock;
    }

       async jobPrice(configCron:string, priceTable:number) {

        let inExec = false
        console.log('[V] Tarefa de envio de preços agendada com sucesso.')

        cron.schedule(configCron, async () => {
            if (inExec) {
                console.log('[X] Tarefa de envio de preços ainda em execução.')
                return
            }

            try {
                inExec = true
                console.log('[V] Executando tarefa de preços dos Produtos...')

                await this.syncInventoryPrice.exec( priceTable );

            } catch (e) {
                console.error('Erro no Job de preços:', e)
            } finally {
                inExec = false
                console.log('[V] Fim da tarefa de envio de preços dos Produtos.')
            }
        })

    }

       async jobStock(configCron:string ) {

        let inExec = false
        console.log('[V] Tarefa de envio de estoque agendada com sucesso.')

        cron.schedule(configCron, async () => {
            if (inExec) {
                console.log('[X] Tarefa de envio de estoque ainda em execução.')
                return
            }

            try {
                inExec = true
                console.log('[V] Executando tarefa de envio de estoque...')
 
                 await this.syncInventoryStock.exec();

            } catch (e) {
                console.error('Erro no Job de estoque:', e)
            } finally {
                inExec = false
                console.log('[V] Fim da tarefa de envio de estoque.')
            }
        })

    }

}