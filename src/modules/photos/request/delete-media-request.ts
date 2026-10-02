 
 
 import { getShopify } from "../../../shared/api/api.ts";
 
 export class DeleteMediaRequest {
  
 

   async deleteMediaFromShopify(
        shopifyProductId: string, mediaIds: string[] 
    ): Promise<string[] | null> {
        const shopify = await getShopify();

        const mutation = `
            mutation productDeleteMedia($productId: ID!, $mediaIds: [ID!]!) {
                productDeleteMedia(productId: $productId, mediaIds: $mediaIds) {
                    deletedMediaIds
                    userErrors { field message }
                }
            }
        `;

        const { data, errors } = await shopify.request(mutation, {
            variables: {
                productId: shopifyProductId,
                mediaIds
            }
        });

        if (errors) {
            console.log(`Erro ao deletar mídia do produto ${shopifyProductId}:`, errors);
            return null;
        }

        const userErrors = data?.productDeleteMedia?.userErrors;
        if (userErrors && userErrors.length > 0) {
            console.log(`Erros de validação ao deletar mídia do produto ${shopifyProductId}:`, userErrors);
            return null;
        }

        return data?.productDeleteMedia?.deletedMediaIds || null;
 }
    }