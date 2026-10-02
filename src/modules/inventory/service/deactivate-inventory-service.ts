import { conn2, database_api } from "../../../database/database-connection.ts";
import { DeactivateInventoryLocal } from "../request/deactivate-inventory-request.ts";
import { GetInventoryLevelRequest } from "../request/get-inventory-level-request.ts";

/**
 * desativa produto em um determinado local
 */
export class DeactivateInventoryService{

    /**
     * 
     * @param variante_id id da variante na shopify
     * @param location_id  id do local na shopify
     * @returns 
     */
    static async exec(variante_id:string , location_id:string ){

        const inventoryLevelReponse =  await GetInventoryLevelRequest.getInventoryLevelVariant( variante_id, location_id);
        if(!inventoryLevelReponse.success){
            return { success: false, message: "Erro ao consultar inventory level na Shopify" };
        }

        const productVariant = inventoryLevelReponse.data?.productVariant;
        if(!productVariant?.id){
            console.log(`[X]  inventoryLevelId invalido para variante ${variante_id}`);
            return { success: false, message: `inventoryLevelId invalido para variante (${variante_id})`}
        }

        const inventoryLevel = productVariant.inventoryItem?.inventoryLevel;
        if(!inventoryLevel?.id){
            console.log(` [X] inventoryLevel nao encontrado para variante (${variante_id})`);
            return { success: false, message: "# inventoryLevel nao encontrado para essa variante/local"}
        }

        const inventoryLevelID = inventoryLevel.id;

        const responseDeacttivateInventory = await DeactivateInventoryLocal.inventoryDeactvate(inventoryLevelID);
        if(!responseDeacttivateInventory?.success){
            if(responseDeacttivateInventory?.message?.includes("minimum of 1 location")){
                //console.warn(`[WARN] inventoryDeactivate rejected (last location): ${responseDeacttivateInventory.message}`)
                console.warn(`[WARN] A desativação do estoque foi rejeitada (último local): O produto não pôde ser removido do estoque da LOJA porque os produtos precisam estar estocados em pelo menos 1 local.`);
                return { success: true, message: responseDeacttivateInventory.message }
            }   
            const message = JSON.stringify(responseDeacttivateInventory?.message) ||  "Erro ao desativar inventory na Shopify";
            console.warn( message );
            return { success: false, message: responseDeacttivateInventory?.message || "Erro ao desativar inventory na Shopify" }
        }

        const database = `\`${database_api}\``;
        const sql = `UPDATE ${database}.variantes_locais SET is_activate_inventory = 'N' WHERE variante_id = ? AND id_local_shopify = ?; `;
        const values = [ variante_id, location_id ];
        await conn2.query(sql, values)

        return { success: true, message: responseDeacttivateInventory.message }
    }
}