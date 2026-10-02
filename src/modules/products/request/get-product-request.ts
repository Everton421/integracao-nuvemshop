import { getShopify } from "../../../shared/api/api.ts";
type productShopify =  
 
    {
     node: {
       id: string,
      sku: string,
      product: {
        id:string
        title:string
      }
    }
  }
 
  export class GetProductByErpSkuRequest{
     
  static async  getProducts( erp_sku: string ) {
        const shopify = await getShopify();
              
                const { data, errors } = await shopify.request(`
                    query ProductVariantsBySku($query: String!, $first: Int = 50) {
                        productVariants(first: $first, query: $query) {
                        edges {
                            node {
                            id
                            sku
                            product {
                                id
                                title
                            }
                            }
                        }
                        pageInfo {
                            hasNextPage
                            endCursor
                        }
                        }
                    }
                    `, { variables: { query: erp_sku, first: 50 } });
                if (data) {
                    return data.productVariants.edges as productShopify[]

                } else {
                    console.log(errors)
                    return null
                }
            } 
    }