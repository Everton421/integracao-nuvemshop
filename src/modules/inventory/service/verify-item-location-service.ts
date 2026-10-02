import { getShopify } from "../../../shared/api/api.ts";
import { VariantesLocaisIntegration } from "../../products/repository/variantes-locais-integration.ts"; // Assumindo que colocou o getMissingLinks aqui

export class VerifyItemLocation {

    // Agora o método pode ser chamado sem parâmetros (para varrer tudo) 
    // ou com locationId específico
    async verify(locationId?: string) {
        const variantesLocaisIntegration = new VariantesLocaisIntegration();
        const shopify = await getShopify();

        const missingItems = await variantesLocaisIntegration.getvincuuloVariantes(locationId)

        if (missingItems.length === 0) {
            console.log("Nenhum vínculo pendente encontrado.");
            return;
        }

        console.log(`Encontrados ${missingItems.length} itens pendentes de vínculo.`);

        for (const item of missingItems) {

            console.log(`Ativando SKU ${item.erp_sku} no local ${item.id_local_missing}...`);

            const mutation = ` 
            mutation inventoryBulkToggleActivation(
                $inventoryItemId: ID!
                $inventoryItemUpdates: [InventoryBulkToggleActivationInput!]!
            ) {
                inventoryBulkToggleActivation(
                    inventoryItemId: $inventoryItemId
                    inventoryItemUpdates: $inventoryItemUpdates
                ) {
                    inventoryItem { id }
                    userErrors { field, message }
                }
            } `;

            const input = {
                "inventoryItemId": item.inventoryItemId,
                "inventoryItemUpdates": [
                    {
                        "locationId": item.id_local_missing,
                        "activate": true
                    }
                ]
            };

            try {
                const { data, errors } = await shopify.request(mutation, { variables: input });

                if (errors) {
                    console.error(`Erro API Shopify SKU ${item.erp_sku}:`, errors);
                    continue;
                }

                const response = data.inventoryBulkToggleActivation;

                if (response && response.inventoryItem) {

                    await variantesLocaisIntegration.insertOrUpdate({
                        erp_sku: Number(item.erp_sku),
                        id_local_shopify: String(item.id_local_missing),
                        variante_id: String(item.variante_id),
                        estoque: 0,
                        inventoryItemId: String(item.inventoryItemId),
                        id_local: String(item.id_local_interno),
                        ultimo_envio_estoque: '0000-00-00',
                        is_activate_inventory:'N'
                    });

                    console.log(`SUCESSO: Vinculado SKU ${item.erp_sku} ao local.`);

                } else if (response?.userErrors?.length > 0) {

                    const msg = response.userErrors[0].message;
                    console.warn(`Aviso Shopify SKU ${item.erp_sku}: ${msg}`);

                    if (msg.includes("already active") || msg.includes("already enabled")) {
                        await variantesLocaisIntegration.insertOrUpdate({
                            erp_sku: Number(item.erp_sku),
                            id_local_shopify: String(item.id_local_missing),
                            variante_id: String(item.variante_id),
                            estoque: 0,
                            inventoryItemId: String(item.inventoryItemId),
                            id_local: String(item.id_local_interno),
                            ultimo_envio_estoque: '0000-00-00',
                        is_activate_inventory:'N'

                        });
                        console.log("-> Vínculo corrigido no banco local.");
                    }
                }

            } catch (err) {
                console.error(`Erro crítico SKU ${item.erp_sku}:`, err);
            }
        }
    }
}