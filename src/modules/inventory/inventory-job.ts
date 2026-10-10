import cron from 'node-cron';
import { SyncInventoryPrice } from './scripts/inventory-script-price.ts';
import { SyncInventoryStock } from './scripts/inventory-script-stock.ts';

export class InventoryJob {
    private syncInventoryPrice:SyncInventoryPrice
    private syncInventoryStock : SyncInventoryStock

    constructor(
        syncInventoryPrice: SyncInventoryPrice, syncInventoryStock : SyncInventoryStock
    ){  
            this.syncInventoryPrice=syncInventoryPrice 
            this.syncInventoryStock=syncInventoryStock;
    }

       async jobPrice(configCron:string ) {

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

                await this.syncInventoryPrice.exec();

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
        console.log('[V] Tarefa de envio de estoque com sucesso.')

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