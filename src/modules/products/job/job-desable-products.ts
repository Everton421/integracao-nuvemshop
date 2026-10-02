import cron from 'node-cron';
import { conn2, database_api, db_publico } from "../../../database/database-connection.ts";
import { ConfiguracoesIntegration } from "../../config-integration/configuracoes-integration-repository.ts";
import { DateService } from "../../../shared/utils/date-service.ts";
import { delay } from "../../../shared/utils/delay.ts";
import { ProductErpRepository } from "../repository/produto-repository.ts";
import { SyncProductService } from "../services/sync-product-service.ts";

export class JobDesableProducts {

    async job() {
        const configCron = process.env.DESABILITAR_PRODUTOS;
        if (!configCron) {
            return console.log("é necessario configurar a variavel DESABILITAR_PRODUTOS com a expressao cron.");
        }

        let inExec = false;

        cron.schedule(configCron, async () => {
            if (inExec) {
                console.log("[X] Tarefa de desabilitar produtos ainda em execução.");
                return;
            }

            try {
                inExec = true;
                await this.jobProductsInactive();
            } catch (e) {
                console.error("Erro no Job de desabilitar produtos:", e);
            } finally {
                inExec = false;
            }
        });
    }

    async jobProductsInactive() {
        console.log(`[V] Iniciando tarefa de desabilitar produtos do site...`);
        const database = `\`${database_api}\``;

        const produtoRepository = new ProductErpRepository();
        const syncProductService = new SyncProductService();
        const configuracoesIntegration = new ConfiguracoesIntegration();

        try {
            const config = await configuracoesIntegration.select();
            const { atualizar_produtos, tabela_preco } = config[0];
            if (atualizar_produtos !== 'S') return;

            const sql = `
                SELECT cp.codigo
                FROM ${db_publico}.cad_prod cp
                JOIN ${database}.variantes v ON v.erp_sku = cp.codigo
                WHERE 
                  ( v.ativo = 'S' OR v.no_site = 'S') and 
                  ( cp.NO_SITE = 'N' OR  cp.ATIVO ='N'  )
                GROUP BY cp.codigo
            `;

            const [resultProducts] = await conn2.query(sql);
            const products = resultProducts as any[];
            const totalGeral = products.length;

            if (totalGeral === 0) {
                console.log(`[V] Nenhum produto para desabilitar.`);
                return;
            }

            console.log(`[V] ${totalGeral} produto(s) para desabilitar...`);

            let processados = 0;
            let erros = 0;
            const startTime = Date.now();

            for (const p of products) {
                try {
                    const arrProduct = await produtoRepository.findSingleCompleteErpProduct(Number(p.codigo), tabela_preco);

                    if (arrProduct.length > 0) {
                        const product = arrProduct[0];
                        await delay(500);
                        await syncProductService.post(product, [], product.id_produto_pai!, product.variante_id);
                    }
                    processados++;
                } catch (error: any) {
                    erros++;
                    console.error(`\n[X] Erro no produto ${p.codigo}:`, error.message);
                }

                const percentual = ((processados / totalGeral) * 100).toFixed(2);
                const tempoDecorrido = (Date.now() - startTime) / 1000;
                const velocidade = processados / tempoDecorrido;
                const tempoRestante = velocidade > 0 ? ((totalGeral - processados) / velocidade) / 60 : 0;

                process.stdout.write(
                    `\r[Progresso] ${processados}/${totalGeral} (${percentual}%) | ` +
                    `Sucessos: ${processados - erros} | Erros: ${erros} | ` +
                    `ETA: ${tempoRestante.toFixed(1)} min...`
                );
            }

            console.log(`\n[FINISH] Processamento concluído!`);
            console.log(`Total: ${processados} | Sucessos: ${processados - erros} | Erros: ${erros}`);

        } catch (e) {
            console.error("\n[FATAL] Erro no Job:", e);
        }
    }
}