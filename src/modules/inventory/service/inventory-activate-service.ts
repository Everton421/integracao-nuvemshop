import { conn2, database_api } from "../../../database/database-connection.ts"
import { getShopify } from "../../../shared/api/api.ts"

type valuesActivativaInventory   =  { 
    inventoryItemId:string //inventoryItemId: ID do InventoryItem da variante (pode ser obtido via productVariant { inventoryItem { id } }).
    locationId:string //locationId: ID do local.
    available:number // available: quantidade disponível para venda.
    onHand:string | null //onHand: quantidade física no local.
     erp_sku:number
}


/**
 * Ativa e registra o saldo do produto em um determinado local.
 */
export class InventoryActivate{

    /**
     *  inventoryItemId: ID do InventoryItem da variante (pode ser obtido via productVariant { inventoryItem { id } }).
        locationId: ID do local.
        available: quantidade disponível para venda.
        onHand: quantidade física no local.
     * @param param0 
     */
   static async activate({
             available,
             inventoryItemId, 
             locationId,
             onHand,
             erp_sku
    }: valuesActivativaInventory){
        const shopify = await getShopify();

        const mutation = `
        mutation InventoryActivateExample(
            $inventoryItemId: ID!
            $locationId: ID!
            $available: Int
            $onHand: Int
            ) {
            inventoryActivate(
                inventoryItemId: $inventoryItemId
                locationId: $locationId
                available: $available
                onHand: $onHand
            ) {
                inventoryLevel {
                id
                location {
                    id
                    name
                }
                item {
                    id
                }
                }
                userErrors {
                field
                message
                }
            }
            }`;

                const variables = {inventoryItemId, locationId, available, onHand };
                const { data, errors} = await shopify.request(mutation, { variables } );
            if(errors){
                console.log(errors.graphQLErrors?.map((i)=>i.message));
                 return { success: false , data: errors.graphQLErrors}

            }
            if(data){
                    const database = `\`${database_api}\``;
                    const sql = `UPDATE ${database}.variantes_locais set estoque = ?, is_activate_inventory = 'S' WHERE erp_sku = ? AND id_local_shopify = ?; `;
                    const values = [ available, erp_sku, locationId ];
                   const resultUpdate = await conn2.query(sql, values)

                 return { success: true , data: data}
            }
    }
}