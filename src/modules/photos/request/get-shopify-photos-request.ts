import { getShopify } from "../../../shared/api/api.ts";


 

type nodeimageResultRequest ={
        node: {
                url: string,
                altText: string
            }
}

type resultRequest = {
     node: {
    id: string,
    sku: string,
    image: string | null,
    product: {
      id: string,
      title: string,
      images:  {
          edges:nodeimageResultRequest[ ]
      }
    }
  }
}


   type  resultGetProductsMedia = {
         product: {
            id: string,
            media: { nodes: {
                id:string,
                mediaContentType: string
            }[] }
        }
    }

export class GetShopifyPhotosProductsRequest {


    async verifyShopifyPhotos(variante_id?: string) {
        const shopify = await getShopify();


        const { data, errors } = await shopify.request(`
                        query GetVariantById($id: ID!) {
                            node(id: $id) {
                                ... on ProductVariant {
                                id
                                sku

                                # A **única** imagem específica da variante (se existir)
                                image {
                                    url
                                    altText
                                }
                                # Todas (ou as N primeiras) imagens do produto da variante
                                product {
                                    id
                                    title
                                    images(first: 10) {
                                    edges {
                                        node {
                                        url
                                        altText
                                        }
                                    }
                                    }
                                }
                                }
                            }
                                }
                            `, {
                                     variables: { id: variante_id, first: 1 }
                               }
                        );
        if (data) {
            return data as resultRequest
        } else {
            console.log(errors)
        }

    }

 
    async getProductsMedia( productId: string ){
        const shopify = await getShopify();
  
        const { data, errors } = await shopify.request( `query GetProductMediaIds($productId: ID!) {
            product(id: $productId) {
                id
                media(first: 100) {
                nodes {
                    id
                    mediaContentType
                }
                }
            }
            }`,{
               variables: { productId: productId }
            });
  if (data) {
            return data as resultGetProductsMedia
        } else {
            console.log(errors)
        }
    }
}
