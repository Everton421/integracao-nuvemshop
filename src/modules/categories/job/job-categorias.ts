import cron from 'node-cron'
import { SyncCategoryService } from '../service/sync-category-service.ts'

/**
 * Envia as categorias pendentes de forma periodica.
 * O agendamento e ligado pela variavel CATEGORIAS (expressao cron).
 */
export class JobCategorias {

    async job() {
        const configCron = process.env.CATEGORIAS

        if (!configCron) {
            return console.log('[X] É necessário configurar a variável CATEGORIAS com a expressão cron.')
        }

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

                const syncCategoryService = new SyncCategoryService()
                const resultado = await syncCategoryService.post()

                console.log(`[V] Categorias: ${resultado.enviados} enviada(s), ${resultado.falhas} falha(s).`)
            } catch (e) {
                console.error('Erro no Job de Categorias:', e)
            } finally {
                inExec = false
                console.log('[V] Fim da tarefa de envio de categorias.')
            }
        })
    }
}