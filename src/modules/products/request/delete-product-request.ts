import { getShopify } from "../../../shared/api/api.ts";

export class DeleteProductRequest { 
    static async delete (shopifyProductId:string){
            const shopify = await getShopify();
        
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
                        id: shopifyProductId
                    }
                };
        
     
                    const { data, errors } = await shopify.request(mutation, { variables });
        
                    if (errors || data.productDelete.userErrors.length > 0) {
                        const errorMsg = errors
                            //  ? errors.map((e: any) => e.message).join(', ')
                            ? errors.graphQLErrors
                            : data.productDelete.userErrors.map((e: any) => e.message).join(', ');
                        
                            console.log(errorMsg);

                        return null
                    }else{
                        return data;
                    }
        
    }
}