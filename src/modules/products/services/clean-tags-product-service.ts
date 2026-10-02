import { getShopify } from "../../../shared/api/api.ts";
import { type LogsIntegracao } from "../../../shared/interfaces/logs-integracao.ts";
import { delay } from "../../../shared/utils/delay.ts";
import { LogsIntegration } from "../../logs/log-integration.ts";



type itensShopifyCleanTags = {
    id: string,
    tags: string[]
}

export class CleanTagsShopifyProductService {

    async cleanOrphanTags(itens: itensShopifyCleanTags[]) {


        const shopify = await getShopify();
        const logIntegration = new LogsIntegration();
        const results = { sucess: 0, error: 0, details: [] as string[] };

        console.log(`[*] Iniciando limpeza de tags em ${itens.length} produtos...`);

        for (const product of itens) {
            try {
                // ESTRATÉGIA: Filtrar para manter apenas tags importantes
                // Se você quiser APAGAR TUDO, basta passar tags: []
                const tagsParaManter = product.tags.filter((tag: string) =>
                    tag.includes('origem:') || tag.includes('garantia:')
                );

                const mutation = `
                mutation productUpdate($input: ProductInput!) {
                    productUpdate(input: $input) {
                        product {
                            id
                            tags 
                        }
                        userErrors {
                            field
                            message
                        }
                    }
                }
            `;

                const variables = {
                    input: {
                        id: product.id,
                        tags: tagsParaManter // Aqui definimos as novas tags (limpando o que não estiver no filtro)
                    }
                };

                const { data, errors } = await shopify.request(mutation, { variables });
                console.log("OK: ", data)
                if (errors || data.productUpdate.userErrors.length > 0) {
                    results.error++;
                    console.log(`[X] Erro ao limpar produto ${product.id}`);
                } else {
                    results.sucess++;
                }

                // Respeitar o rate limit (50ms a 200ms é seguro para mutations simples)
                await delay(150);

            } catch (err) {
                results.error++;
            }
        }

        // Log final
        await logIntegration.insert({
            action: 'clean_orphan_tags',
            referencia: 'product',
            message: `Limpeza de tags concluída. Sucesso: ${results.sucess}, Erro: ${results.error}`,
            referencia_id: 0,
            status: results.error === 0 ? 'sucess' : 'warning',
            dados_shopify: JSON.stringify(results)
        } as Omit<LogsIntegracao, 'id' | 'created_at'>);


    }
}
