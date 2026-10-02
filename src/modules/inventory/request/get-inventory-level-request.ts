import { getShopify } from "../../../shared/api/api.ts";


type inventoryLevel= {
  productVariant: {
    id: string,
    title: string,
    inventoryItem: {
      id: string,
      inventoryLevel:{
         id:  string,
        quantities: [
            { name:  string, quantity: number },
            { name:  string, quantity: number }
        ]
      }
    }
  }
}

export class GetInventoryLevelRequest{
    static async getInventoryLevelVariant( variantId:string , locationId:string ):Promise<{ success: boolean, data: any}>{
                const shopify = await getShopify();

             const query = `
               query InventoryLevelForVariantAtLocation($variantId: ID!, $locationId: ID!) {
                productVariant(id: $variantId) {
                            id
                            title
                            inventoryItem {
                                id
                                inventoryLevel(locationId: $locationId) {
                                id
                                quantities(names: ["available", "on_hand"]) {
                                    name
                                    quantity
                                }
                                }
                            }
                            }
                        }
             `;
            const variables  = { "variantId": variantId, "locationId":locationId};
                const { data , errors } = await shopify.request(query,  {variables}   );
          if(data){
              return { success: true, data: data as inventoryLevel  }
          }else{
            console.log(errors?.graphQLErrors);
              return { success: false, data: errors?.graphQLErrors }
          }

        
        
    }
}