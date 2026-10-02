import { getShopify } from "../../../shared/api/api.ts";
import { type LogsIntegracao } from "../../../shared/interfaces/logs-integracao.ts";
import { delay } from "../../../shared/utils/delay.ts";
import { LogsIntegration } from "../../logs/log-integration.ts";  

interface DeleteResult {
    success: boolean;
    message: string;
    data?: { deletedProductId: string; deletedProductHandle: string };
}

interface BulkDeleteResult {
    success: boolean;
    message: string;
    data?: { successCount: number; errorCount: number; details: { id: string; success: boolean; message: string }[] };
} 

export class DeleteProductService {

    async delete(productId: string): Promise<DeleteResult> {
        const shopify = await getShopify();
        const logIntegration = new LogsIntegration();

        const mutation = `
            mutation productDelete($input: ProductDeleteInput!) {
               productDelete(input: $input) {
                    deletedProductId
                    productDeleteOperation {
                        id
                        status
                        deletedProductId
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
                id: productId
            }
        };

        try {
            const { data, errors } = await shopify.request(mutation, { variables });

            if (errors || data.productDelete.userErrors.length > 0) {
                const errorMsg = errors
                    //  ? errors.map((e: any) => e.message).join(', ')
                    ? errors.graphQLErrors
                    : data.productDelete.userErrors.map((e: any) => e.message).join(', ');

                await logIntegration.insert({
                    referencia: 'product',
                    referencia_id: 0,
                    action: 'delete_product',
                    status: 'error',
                    dados_shopify: JSON.stringify({ productId, errors: errorMsg }),
                    message: `Erro ao deletar produto ${productId}: ${errorMsg}`
                } as Omit<LogsIntegracao, 'id' | 'created_at'>);

                return { success: false, message: errorMsg };
            }

            await logIntegration.insert({
                referencia: 'product',
                referencia_id: 0,
                action: 'delete_product',
                status: 'sucess',
                dados_shopify: JSON.stringify(data.productDelete),
                message: `Produto ${productId} deletado com sucesso. Handle: ${data.productDelete.deletedProductHandle}`
            } as Omit<LogsIntegracao, 'id' | 'created_at'>);

            return {
                success: true,
                message: `Produto deletado com sucesso`,
                data: {
                    deletedProductId: data.productDelete.deletedProductId,
                    deletedProductHandle: data.productDelete.deletedProductHandle
                }
            };

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);

            await logIntegration.insert({
                referencia: 'product',
                referencia_id: 0,
                action: 'delete_product',
                status: 'error',
                dados_shopify: JSON.stringify({ productId, error: errorMessage }),
                message: `Erro ao deletar produto ${productId}: ${errorMessage}`
            } as Omit<LogsIntegracao, 'id' | 'created_at'>);

            return { success: false, message: errorMessage };
        }
    }

    async deleteBulk(productIds: string[]): Promise<BulkDeleteResult> {
        const shopify = await getShopify();
        const logIntegration = new LogsIntegration();
        const results = { successCount: 0, errorCount: 0, details: [] as { id: string; success: boolean; message: string }[] };

        console.log(`[*] Iniciando deleção em massa de ${productIds.length} produtos...`);

        for (const productId of productIds) {
            const mutation = `
                mutation productDelete($input: ProductDeleteInput!) {
                    productDelete(input: $input) {
                        deletedProductId
                        deletedProductHandle
                        userErrors {
                            field
                            message
                        }
                    }
                }
            `;

            const variables = { input: { id: productId } };

            try {
                const { data, errors } = await shopify.request(mutation, { variables });

                if (errors || data.productDelete.userErrors.length > 0) {
                    results.errorCount++;
                    const errorMsg = errors && Array.isArray(errors)
                        ? errors.map((e: any) => e.message).join(', ')
                        : data.productDelete.userErrors.map((e: any) => e.message).join(', ');

                    results.details.push({ id: productId, success: false, message: errorMsg });
                    console.log(`[X] Erro ao deletar produto ${productId}: ${errorMsg}`);
                } else {
                    results.successCount++;
                    results.details.push({ id: productId, success: true, message: `Handle: ${data.productDelete.deletedProductHandle}` });
                    console.log(`[OK] Produto ${productId} deletado com sucesso.`);
                }

                await delay(150);

            } catch (err) {
                results.errorCount++;
                const errorMessage = err instanceof Error ? err.message : String(err);
                results.details.push({ id: productId, success: false, message: errorMessage });
                console.log(`[X] Erro ao deletar produto ${productId}: ${errorMessage}`);
            }
        }

        const overallStatus = results.errorCount === 0 ? 'sucess' : results.successCount === 0 ? 'error' : 'warning';

        await logIntegration.insert({
            referencia: 'product',
            referencia_id: 0,
            action: 'delete_product_bulk',
            status: overallStatus,
            dados_shopify: JSON.stringify(results),
            message: `Bulk delete concluído. Sucesso: ${results.successCount}, Erros: ${results.errorCount}`
        } as Omit<LogsIntegracao, 'id' | 'created_at'>);

        return {
            success: results.errorCount === 0,
            message: `Deleção em massa concluída. Sucesso: ${results.successCount}, Erros: ${results.errorCount}`,
            data: results
        };
    }
}
