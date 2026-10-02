import { getShopify } from "../../../shared/api/api.ts";

export class UploadMediaForShopifyRequest{

    /**
     *  envia fotos para produto na shopify
     * @param shopifyProductId 
     * @param media 
     * @param erp_sku 
     * @returns 
     */
    static async appendMediaToShopify(
            shopifyProductId: string, media: { originalSource: string; alt: string; mediaContentType: "IMAGE" }[], erp_sku: number  ): Promise<{ id: string }[] | null> {
            const shopify = await getShopify();
    
            const mutation = `
                mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
                    productCreateMedia(productId: $productId, media: $media) {
                        media {
                            id
                            ... on MediaImage {
                                image { url }
                            }
                        }
                        userErrors { field message }
                    }
                }
            `;
    
            const { data, errors } = await shopify.request(mutation, {
                variables: {
                    productId: shopifyProductId,
                    media
                }
            });
    
            if (errors) {
                console.log(`Erro ao adicionar mídia SKU ${erp_sku}:`, errors);
                return null;
            }
    
            const userErrors = data?.productCreateMedia?.userErrors;
            if (userErrors && userErrors.length > 0) {
                let error = userErrors.graphQLErrors;
    
                console.log(`Erros de validação ao adicionar mídia SKU ${erp_sku}:`,error  );
                return null;
            }
    
            return data?.productCreateMedia?.media || null;
        }
}