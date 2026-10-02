import { conn2, database_api } from "../../../database/database-connection.ts";
import { getShopify } from "../../../shared/api/api.ts";
import { delay } from "../../../shared/utils/delay.ts";
import { ProductErpRepository } from "../repository/produto-repository.ts";

export class GetVariantsService{
     
   static async getVariants() {

        const databaseApi = `\`${database_api}\``;
    
        const shopify = await getShopify();
        const productoRepository = new ProductErpRepository();

        const allProduct = await productoRepository.findProductsErp();


        if (allProduct.length > 0) {
            for (const i of allProduct) {

                await delay(250);

                const skuSearch = String(i.CODIGO);
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
                    `, { variables: { query: skuSearch, first: 50 } });
                if (data) {
                    console.log(data.productVariants.edges)

                } else {
                    console.log(errors)

                }

                const shopify_product_id = data.productVariants.edges[0]?.node.product.id;
                const shopify_variant_id = data.productVariants.edges[0]?.node.id;
                const sku_erp = data.productVariants.edges[0]?.node.sku;

                const [resultVerify] = await conn2.query(`SELECT id FROM ${databaseApi}.variantes_copy WHERE erp_sku = ${i.CODIGO}`);
                const verify = resultVerify as any[];
                if (verify.length > 0) {
                    console.log(`Variante ${i.CODIGO} já fora registrada.`);
                } else {
                    await conn2.query(`INSERT INTO ${databaseApi}.variantes_copy SET
                                         id_produto_pai ='${shopify_product_id}',
                                         variante_id = '${shopify_variant_id}' , 
                                         erp_sku = '${sku_erp}',
                                         titulo = '' `
                    )
                }


            }

        }




    }

}