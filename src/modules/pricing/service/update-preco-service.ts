import { getShopify } from "../../../shared/api/api.ts";
import { DateService } from "../../../shared/utils/date-service.ts";
import { ProdutoIntegration } from "../../products/repository/produto-integration-repository.ts";
import { VarianteIntegration } from "../../products/repository/variants-integration.ts";

type input = {
    variantId: string
    price: number
    promotion:number
    productId: string
    data_promocao:string
}

export class UpdatePrecoService {

    async post(input: input, erp_sku: number, data_recad: string) {
        const dateService = new DateService();
        const shopify = await getShopify();

        const varianteIntegration = new VarianteIntegration();
        const produtoIntegration = new ProdutoIntegration();

        const mutation = `
            mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
                productVariantsBulkUpdate(productId: $productId, variants: $variants) {
                    product {
                        id
                    }
                    productVariants {
                        id
                        price
                        compareAtPrice 
                    }
                    userErrors {
                        field
                        message
                    }
                }
            }
        `;

        const variables = {
            productId: input.productId,
            variants: [
                {
                    id: input.variantId,
                     price: input.promotion > 0 ? String(input.promotion) : String(input.price) ,
                    compareAtPrice: input.promotion > 0 ? String(input.price) :  null,
                }
            ]
        };
        const { data, errors } = await shopify.request(mutation, { variables: variables });



        if (errors) {
            //  errors.graphQLErrors?.map( ( i ) =>{
            //      console.log("Erro ao tentar atualizar produto   ",i)
            //      i.extensions.value.variants.map(( a:any ) =>console.log(a))
            //  })
            console.log("errors: ", errors);
            return { sucess: false, message: `Erro ao tentar atualizar o preco da variante . ${erp_sku} ${errors}` }
        }

        if (data) {
            const resultVariant = await varianteIntegration.update(
                {
                    ultimo_envio_preco: dateService.formatarDataHora(data_recad),
                    preco: input.price
                },
                erp_sku);
            if (!resultVariant.sucess) {
                return { sucess: false, message: `Erro ao tentar atualizar o preco da variante no banco de dados  ` }
            }

            const resultProd = await produtoIntegration.update(
                { 
                    ultimo_envio_preco: dateService.obterDataHoraAtual(),
                     preco: input.price,
                     promocao: input.promotion,
                    data_promocao: input.data_promocao
                    }
                , erp_sku)
            if (!resultProd.sucess) {
                return { sucess: false, message: `Erro ao tentar atualizar o preço do produto no banco de dados  ` }
            }

            return { sucess: true, message: `Preço enviado para o produto ${erp_sku}` }
        }
        if (!data) {

            return { sucess: false, message: `Erro inesperado ao tentar enviar o preço do produto ${erp_sku}.` }
        }


    }
}