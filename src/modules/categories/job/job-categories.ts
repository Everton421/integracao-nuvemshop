import cron from 'node-cron';
import { SyncCategoriesCommand } from '../sync-categories-command.ts';


export class JobCategories {

          private syncCategoriesCommand:SyncCategoriesCommand;

        constructor( syncCategoriesCommand:SyncCategoriesCommand ){
            this.syncCategoriesCommand =syncCategoriesCommand; 
        }   

    async job(configCron:string ) {

        let inExec = false
        console.log('[V] Tarefa de envio de categorias agendada com sucesso.')

        cron.schedule(configCron, async () => {
            if (inExec) {
                console.log('[X] Tarefa de envio de categorias ainda em execução.')
                return
            }

            try {
                inExec = true
                console.log('[V] Executando tarefa de envio de categorias...')
 
                    // Envia/Atualiza as Categorias
                await this.syncCategoriesCommand.executeCategory(500);

                    // Envia/Atualiza as subcategorias
                await this.syncCategoriesCommand.executeSubCategories(500);

            } catch (e) {
                console.error('Erro no Job de Categorias:', e)
            } finally {
                inExec = false
                console.log('[V] Fim da tarefa de envio de categorias.')
            }
        })
    }
}