import { getShopify } from "../../../shared/api/api.ts";
import { type variante_locais } from '../../../shared/interfaces/variantes-locais.ts';
import { DateService } from "../../../shared/utils/date-service.ts";
import { VariantesLocaisIntegration } from "../../products/repository/variantes-locais-integration.ts";

export class UpdateEstoqueService {

    async post(input: Omit<variante_locais, 'created_at' | 'id'| 'is_activate_inventory'  | 'updated_at'>): Promise<{ success: boolean, message: string } | undefined> {
        const dateService = new DateService();
        const variantesLocaisIntegration = new VariantesLocaisIntegration();
        const shopify = await getShopify();


        const mutation = ` 
         mutation inventorySetOnHandQuantitires($input: InventorySetOnHandQuantitiesInput!){
              inventorySetOnHandQuantities(input: $input) {
                userErrors {
                    field
                    message
                }
                inventoryAdjustmentGroup {
                        createdAt
                        reason
                        referenceDocumentUri
                    changes {
                        name
                        delta
                    }
                }
            }
         }
        `;
        const inputVariables = {
            input: {
                reason: "correction",
                setQuantities: [
                    {
                        inventoryItemId: input.inventoryItemId,
                        locationId: input.id_local_shopify,
                        quantity: Number(input.estoque)  // Garante que é número
                    }
                ]
            }
        };

        const { data, errors } = await shopify.request(mutation, { variables: inputVariables });

        if (errors) {

            console.log("errors: ", errors);
            return { success: false, message: `Erro ao tentar enviar o saldo de estoque do produto. ${input.erp_sku} ${errors}` }
        }

        if (data) {

            const resultVariantLocal = await variantesLocaisIntegration.insertOrUpdate({
                erp_sku: input.erp_sku,
                estoque: input.estoque,
                id_local: input.id_local,
                id_local_shopify: input.id_local_shopify,
                inventoryItemId: input.inventoryItemId,
                ultimo_envio_estoque: dateService.obterDataHoraAtual(),
                variante_id: input.variante_id,
                is_activate_inventory: 'S'

            });


            if (!resultVariantLocal.sucess) {
                return { success: false, message: `Erro ao tentar atualizar o saldo da variante no banco de dados  ` }
            }


            return { success: true, message: `Saldo enviado para o produto ${input.erp_sku}` }
        }
        if (!data) {
            return { success: false, message: `Erro inesperado ao tentar enviar o saldo do produto ${input.erp_sku}.` }
        }

    }
}