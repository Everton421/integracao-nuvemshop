import { getShopify } from "../../../shared/api/api.ts";
import { CanaisVendaIntegration } from "../../sales-channels/sales-channels-repository.ts";
import { ProdutoIntegration } from "../repository/produto-integration-repository.ts";


export class PublishProductService {

  async publish(productId: string, publicationId: string) {
    const shopify = await getShopify();

    const mutation = `
    mutation PublishProductToChannel($productId: ID!, $publicationId: ID!) {
        publishablePublish(id: $productId, input: [{ publicationId: $publicationId }]) {
          userErrors {
            field
            message
          }
          publishable {
            __typename
            ... on Product {
              id
              title
              status
            }
          }
        }
      }
  `;

    const variables = {
      productId,      // ex.: "gid://shopify/Product/921728736"
      publicationId,  // ex.: "gid://shopify/Publication/762454635"
    };
    const { data, errors } = await shopify.request(mutation, { variables });

    if (errors) console.log("Erro ao tentar liberar produto nocanal de venda : ", errors);
    if (errors) {
      return { success: false, message: errors };
    }
    if (data) {
      return { success: true, message: data };
    }
  }

  async unpublish(productId: string, publicationId: string) {
    const shopify = await getShopify();

    const mutation = `
      mutation UnpublishProductFromChannel($productId: ID!, $publicationId: ID!) {
        publishableUnpublish(
          id: $productId
          input: [{ publicationId: $publicationId }]
        ) {
          userErrors {
            field
            message
          }
          publishable {
            __typename
            ... on Product {
              id
              title
              status
            }
          }
        }
      }
    `;

    const variables = {
      productId,     // ex.: "gid://shopify/Product/921728736"
      publicationId, // ex.: "gid://shopify/Publication/762454635"
    };

    const { data, errors } = await shopify.request(mutation, { variables });

    if (errors) {
      console.log("Erro ao tentar bloquear produto no canal de venda: ", errors);
      return { success: false, message: errors };
    }

    return { success: true, message: data };
  }


  async publishProdutctChannel(erp_sku: number, liberar: boolean) {
    const canaisVendaIntegration = new CanaisVendaIntegration();
    const produtosIntegration = new ProdutoIntegration();

    const arrChannel = await canaisVendaIntegration.selecByParam({ name: 'Online Store' });
    const id_channel_shopify = arrChannel[0].id_shopify;
    const arrProductIntegration = await produtosIntegration.selectByParam({
      erp_sku: String(erp_sku)
    })
    const { shopify_product_id } = arrProductIntegration[0];

    const result = liberar ? await this.publish(shopify_product_id, id_channel_shopify)
      : await this.unpublish(shopify_product_id, id_channel_shopify)

    if (result?.success) {
      const acao = liberar ? 'liberado' : 'bloqueado'
      console.log(`Produto : ${erp_sku} ${acao} no ${arrChannel[0].name}`)
    }
    return result;
  }
}