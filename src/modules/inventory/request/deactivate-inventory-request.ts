import { getShopify } from "../../../shared/api/api.ts";

export class DeactivateInventoryLocal{

    static async inventoryDeactvate( inventoryLevelId: string ){
        const shopify = await getShopify();
        
        const mutation = `
            mutation DeactivateInventoryAtLocation($inventoryLevelId: ID!) {
                inventoryDeactivate(inventoryLevelId: $inventoryLevelId) {
                    userErrors {
                    field
                    message
                    }
                }
            }
        `
        const variables = { "inventoryLevelId": inventoryLevelId  };
        
        const { data, errors } = await shopify.request(mutation, {variables});
        console.log(data)
        if( data ){
            const userErrors = data?.inventoryDeactivate?.userErrors;
            if(userErrors && userErrors.length > 0){
                return { success:false , message: userErrors.map(i => i.message).join(', ') }
            }
            return { success:true , message:"OK!"}
        }
        if(errors){
                console.log( errors.graphQLErrors?.map(i=>i))
             return { success:false , message: errors.graphQLErrors?.map(i=>i)}
        }

        return { success: false, message: "Erro desconhecido ao desativar inventory" }
    }
}