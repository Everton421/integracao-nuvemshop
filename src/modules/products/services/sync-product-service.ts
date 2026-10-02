
import { getShopify } from "../../../shared/api/api.ts";
import { type ICompleteProduct } from "../../../shared/interfaces/cad_prod.ts";
import { type LogsIntegracao } from "../../../shared/interfaces/logs-integracao.ts";
import { type variante_locais } from "../../../shared/interfaces/variantes-locais.ts";
import { DateService } from "../../../shared/utils/date-service.ts";
import { FormatString } from "../../../shared/utils/format-string.ts";
import { LocaisIntegration } from "../../inventory/repository/locais-integration-repository.ts";
import { LogsIntegration } from "../../logs/log-integration.ts";
import { ProdutoIntegration } from "../repository/produto-integration-repository.ts";
import { ProductErpRepository } from "../repository/produto-repository.ts";
import { VariantesLocaisIntegration } from "../repository/variantes-locais-integration.ts";
import { PublishProductService } from "../services/publish-channel-product-service.ts";
    
import { CompanyRepository } from "../../company/company-repository.ts";
import { ErpInventoryRepository } from "../../inventory/repository/erp-inventory-repository.ts";
import { DeactivateInventoryService } from "../../inventory/service/deactivate-inventory-service.ts";
import { InventoryActivate } from "../../inventory/service/inventory-activate-service.ts";
import { UpdateEstoqueService } from "../../inventory/service/update-estoque-service.ts";
import { VerifyDatePromotion } from "../../pricing/utils/verify-date-promotion.ts";
import { VarianteIntegration } from "../repository/variants-integration.ts";

type productSet = {
    productSet: {
        product: {
            id: string,
            title: string,
            variants: {
                nodes: [
                    {
                        id: string,
                        sku: string,
                        barcode: string,
                        price: string,
                        inventoryItem: {
                            id: string
                        }
                    }
                ]
            }
        },
    }
}
type imgshopify = {
    originalSource: string
    alt: string
    filename: string
    contentType: "IMAGE"
}

export class SyncProductService {

    async post(product: ICompleteProduct, imagens: string[] | [], shopifyProductId?: string, shopifyVariantId?: string) {

        const varianteIntegration = new VarianteIntegration();
        const produtoIntegration = new ProdutoIntegration();
        const variantesLocaisIntegration = new VariantesLocaisIntegration();
        const inventoryRepository = new ErpInventoryRepository();
        const produtoRepository = new ProductErpRepository();
        const updateEstoqueService = new UpdateEstoqueService();
            const locaisIntegration = new LocaisIntegration();

        const companyRepository: CompanyRepository = new CompanyRepository() ;

       const resultIndiceErp = await companyRepository.findIndiceErpParams();
            const {  INDICE } = resultIndiceErp[0];

        const publishProductService = new PublishProductService();
        const shopify = await getShopify();

        const formatString = new FormatString()

        const dateService = new DateService();
        const logIntegration = new LogsIntegration();
        const verifyDatePromotion = new VerifyDatePromotion();

        const currentDate = dateService.obterDataAtual();

        let log = { action: '', referencia: 'product', message: '', referencia_id: 0, status: 'sucess', dados_shopify: String(product) } as Omit<LogsIntegracao, 'id' | 'created_at'>;

        const acquired = await produtoRepository.acquireLock(product.CODIGO, 30);
        if (!acquired) {
            return { sucess: false, message: `Não foi possível adquirir lock para o produto ${product.CODIGO}` };
        }
        try {
        if (!shopifyProductId) {
            console.log(`[V] Checando se produto ${product.CODIGO} já foi enviado ...`);
            const checkProductAlreadySend = await produtoIntegration.selectByParam({ erp_sku: String(product.CODIGO) });
            if (checkProductAlreadySend.length > 0) {
                console.log(`[V] Checando variante do produto ${product.CODIGO} ...`);

                shopifyProductId = checkProductAlreadySend[0].shopify_product_id;
                const checkVariant = await varianteIntegration.selectBySkuErp(product.CODIGO);
                if (checkVariant.length > 0) {
                    shopifyVariantId = checkVariant[0].variante_id;
                }
            }
        } else {
            console.log(`[V] produto ${product.CODIGO} já foi enviado, verificando possivel atualização ...`);
        }
        // ----------------------------------------

        const isUpdate = !!shopifyProductId;

        ///  verifica se o produto é novo e esta habilitado para ir para o site
            if(!isUpdate && product.NO_SITE && product.NO_SITE == 'N'){
                console.log(`[V] produto ${product.CODIGO} não esta habilitado para enviar para o site.`);
                return
            }

        ///  verifica se o produto é novo e esta ativo no sistema, para que nao seja enviado produto inativo
            if(!isUpdate && product.ATIVO && product.ATIVO == 'N'){
                 console.log(`[V] produto ${product.CODIGO} não ativo no sistema.`);
                return
            }
 
 /**  ------ estoque sc ---------------------------------------------------------------------------------------------------------*/           
            // dados do setor SC na shopify

         const localSc = await locaisIntegration.selectById(2);


        let estoqueSc = 0;
        // id na shopify
        const idLocalScShopify = localSc[0].id_shopify;
          const idInternoSc = localSc[0].id;
        
 
 /**  ------ estoque LOja---------------------------------------------------------------------------------------------------------*/           


            // dados do setor loja na shopify
        const localLoja = await locaisIntegration.selectById(1);

        const idLocalLojaSHopify = localLoja[0].id_shopify;
        const idInternoLoja = localLoja[0].id

        let estoqueLoja = 0


        let inputInsertVarianteLocal: Omit<variante_locais, 'created_at'  | 'updated_at' | 'id'>[] = [
            {
                erp_sku: Number(product.CODIGO),
                estoque: Number(estoqueSc),
                id_local_shopify: idLocalScShopify,
                variante_id: '',
                id_local: String(idInternoSc),
                ultimo_envio_estoque: dateService.obterDataHoraAtual(),
                inventoryItemId: '' ,
                is_activate_inventory: estoqueSc && estoqueSc > 0 ? 'S' : 'N'
                
            },
            {
                erp_sku: Number(product.CODIGO),
                estoque: Number(estoqueLoja),
                id_local_shopify: idLocalLojaSHopify,
                variante_id: '',
                id_local: String(idInternoLoja),
                ultimo_envio_estoque: dateService.obterDataHoraAtual(),
                 inventoryItemId: '',
                is_activate_inventory: estoqueLoja && estoqueLoja > 0 ? 'S' : 'N'

            }

        ]


    
                const isPromotion = verifyDatePromotion.verify(currentDate ,product.VALID_PROM );

           let productPrice = product.PRECO;
           let productPromotion = isPromotion ? product.PROMOCAO :  0 ;

            if(product.INDEXADO === 'S' )  productPrice = product.PRECO * INDICE; 
            if(product.INDEXADO === 'S' )  productPromotion = isPromotion ? (product.PROMOCAO * INDICE) : 0 ;  


        const variantInput: any = {
            optionValues: [{ optionName: "Title", name: "Default Title" }],
            sku: String(product.CODIGO),
            price: productPromotion > 0 ? String(productPromotion) : String(productPrice) ,
            compareAtPrice: productPromotion > 0 ? String(productPrice) :  null,
            barcode: product.NUM_FABRICANTE,
            inventoryPolicy: "DENY",
            inventoryItem: {
                tracked: true,
                measurement: {
                    weight: {
                        value: Number(product.PESO),
                        unit: 'KILOGRAMS'
                    }
                }
            },
        };

       
            
        

        // SE TIVER ID DA VARIANTE (UPDATE), ADICIONAMOS AQUI
        // Isso evita que a Shopify delete a variante antiga e crie uma nova
        if (shopifyVariantId) {
            variantInput.id = shopifyVariantId;
        }


        const metafields = [
        ]

        const comprimento = Number(product.COMPRIMENTO).toFixed(2) || 0;
        metafields.push(
            {
                namespace: "custom",
                key: "comprimento",
                type: "number_decimal",
                value: `${comprimento}`
            })
            
            if(product.DESCR_CURTA_SITE && product.DESCR_CURTA_SITE.trim() !== '' ){
            const descricao_curta =  product.DESCR_CURTA_SITE.trim() || '';
                metafields.push(
                    {
                        namespace: "custom",
                        key: "descricao_curta",
                        type: "multi_line_text_field",
                        value: `${descricao_curta}`
                    })
            }

     if(product.APLICACAO_SITE && product.APLICACAO_SITE.trim() !== '' ){
            const aplicacao_site =  product.APLICACAO_SITE.trim() || '';
                metafields.push(
                    {
                        namespace: "custom",
                        key: "aplicacao",
                        type: "multi_line_text_field",
                        value: `${aplicacao_site}`
                    })
            }

        const largura = Number(product.LARGURA).toFixed(2) || 0;
        metafields.push(
            {
                namespace: "custom",
                key: "largura",
                type: "number_decimal",
                value: `${largura}`
            })

        const altura = Number(product.ALTURA).toFixed(2) || 0;
        metafields.push({
            namespace: "custom",
            key: "altura",
            type: "number_decimal",
            value: `${altura}`
        })


        const tags = []

        if (product.ORIGEM) tags.push(`origem:${product.ORIGEM}`);
        if (product.GARANTIA) tags.push(`garantia:${product.GARANTIA}`);
        if (product.CATEGORIA) {
            tags.push(`${product.CATEGORIA}`);
            metafields.push(
                {
                    namespace: "custom",
                    key: "grupo",
                    type: "multi_line_text_field",
                    value: `${product.CATEGORIA}`
                })
        }


        if (product.SUBCATEGORIA) {
            tags.push(`${product.SUBCATEGORIA}`);
            metafields.push(
                {
                    namespace: "custom",
                    key: "subgrupo",
                    type: "multi_line_text_field",
                    value: `${product.SUBCATEGORIA}`
                })
        }

        const tituloFinal = (product.TITULO_SITE || product.DESCRICAO || "Produto sem título").toString();
        //const descricaoFinal = (product.APLICACAO_SITE || product.DESCR_CURTA_SITE || product.DESCR_LONGA_SITE || product.APLICACAO || "").toString().replace(/[\r\n]+/g, ' ');
        const descricaoFinal = ( product.DESCR_LONGA_SITE  || "").toString().replace(/[\r\n]+/g, ' ');

        const shopifyStatus = product.ATIVO === 'S' ? "ACTIVE" : "ARCHIVED";

        const inputPayload: any = {
            title: tituloFinal.trim(),
            descriptionHtml: descricaoFinal.trim(),
            vendor: product.MARCA,
            productType: product.CATEGORIA,
            status: shopifyStatus,
            tags: tags,
            productOptions: [{ name: "Title", values: [{ name: "Default Title" }] }],
            metafields: metafields,
            variants: [variantInput]
        };

     

        if (shopifyProductId) {
            inputPayload.id = shopifyProductId;
        }

        log.dados_shopify = JSON.stringify(inputPayload);

        const inputVariables = { input: inputPayload };

        const mutation = `
            mutation productSet($input: ProductSetInput!) {
                productSet(synchronous: true, input: $input) {
                    product {
                        id
                        title
                        handle
                        variants(first: 5) {
                            nodes {
                                id
                                sku
                                price
                                inventoryItem {
                                    id
                                }
                            }
                        }
                    }
                    userErrors {
                        field
                        message
                    }
                }
            }
        `;
        try {

            const { data, errors } = await shopify.request(mutation, { variables: inputVariables });

            if (errors) {
                console.log(`Erro ao tentar ${isUpdate ? 'atualizar' : 'registrar'} [OPERATION]`, errors);
                log.message = ` Erro ao tentar ${isUpdate ? 'atualizar' : 'registrar'} [OPERATION]. Produto ${product.CODIGO}`;
                log.status = "error"
                return { sucess: false, message: errors };
            }

            const userErrors = data?.productSet?.userErrors;
            if (userErrors && userErrors.length > 0) {
                console.log("Erros de validação dos produtos :", userErrors);
                return { sucess: false, message: userErrors[0].message }; // Retornando msg legível
            }
            const resultPostProduct = data as productSet;

            //console.log(resultPostProduct.productSet.product.variants.nodes[0].inventoryItem.id)

            const inventoryItemId = resultPostProduct.productSet.product.variants.nodes[0].inventoryItem.id;
            const variante_id = resultPostProduct.productSet.product.variants.nodes[0].id

            console.log(isUpdate ? "Produto atualizado na Shopify!" : "Produto criado na Shopify!");

            //await publishProductService.publishProdutctChannel( product.CODIGO )   

            if (isUpdate) {
                await produtoIntegration.update(
                    {
                        dados_produto: JSON.stringify(resultPostProduct.productSet.product),
                        preco: product.PRECO,
                        sync_status: 'synced',
                        titulo: formatString.tiraAspas(product.DESCRICAO),
                        ultimo_envio_estoque: dateService.obterDataHoraAtual(),
                        ultimo_envio_preco: dateService.obterDataHoraAtual(),
                        data_recad_erp: product.DATA_RECAD,
                        ativo: product.ATIVO,
                        no_site: product.NO_SITE 

                    }, product.CODIGO);

                await varianteIntegration.update({
                    dados_produto: JSON.stringify(resultPostProduct.productSet.product),
                    preco: product.PRECO,
                    sync_status: 'synced',
                    titulo: formatString.tiraAspas(product.DESCRICAO),
                    ultimo_envio_estoque: dateService.obterDataHoraAtual(),
                    ultimo_envio_preco: dateService.obterDataHoraAtual(),
                    ativo: product.ATIVO,
                    no_site: product.NO_SITE 
                }, product.CODIGO);

                for (const i of inputInsertVarianteLocal) {

                    const resultUpdateVarianteLocal = await variantesLocaisIntegration.insertOrUpdate({
                        erp_sku: Number(product.CODIGO),
                        estoque: i.estoque,
                        id_local_shopify: i.id_local_shopify,
                        id_local: i.id_local,
                        variante_id: variante_id,
                        inventoryItemId: inventoryItemId,
                        ultimo_envio_estoque: dateService.obterDataHoraAtual(),
                        is_activate_inventory: i.is_activate_inventory
                    }
                    )
                }

                log.status = "sucess"
                log.message = `Produto ${product.CODIGO} atualizado com sucesso!`
                if (product.NO_SITE === 'S') {
                    await publishProductService.publishProdutctChannel(product.CODIGO, true);
                } else {
                    await publishProductService.publishProdutctChannel(product.CODIGO, false);
                }
                return { sucess: true, message: "Produto atualizado com sucesso!" };

            } else {
                if (resultPostProduct.productSet.product.id) {
                    const resultInsertProduct = await produtoIntegration.inserir({
                        dados_produto: JSON.stringify(resultPostProduct.productSet.product),
                        erp_sku: String(product.CODIGO),
                        error_message: '',
                        preco: product.PRECO,
                        shopify_product_id: resultPostProduct.productSet.product.id,
                        sync_status: 'synced',
                        titulo: formatString.tiraAspas(product.DESCRICAO),
                        ultimo_envio_estoque: dateService.obterDataHoraAtual(),
                        ultimo_envio_preco: dateService.obterDataHoraAtual(),
                        data_recad_erp: product.DATA_RECAD,
                         ativo: product.ATIVO,
                         no_site: product.NO_SITE,
                         data_promocao: product.VALID_PROM,
                         promocao: product.PROMOCAO
                    });
                    if (resultInsertProduct.sucess) {
                        const resultInsertVariant = await varianteIntegration.inserir(
                            {
                                id_produto_pai: resultPostProduct.productSet.product.id,
                                dados_produto: JSON.stringify(resultPostProduct.productSet.product),
                                erp_sku: String(product.CODIGO),
                                error_message: '',
                                preco: product.PRECO,
                                variante_id: resultPostProduct.productSet.product.variants.nodes[0].id,
                                sync_status: 'synced',
                                titulo: formatString.tiraAspas(product.DESCRICAO),
                                inventoryItemId: inventoryItemId,
                                ultimo_envio_estoque: dateService.obterDataHoraAtual(),
                                ultimo_envio_preco: dateService.obterDataHoraAtual(),
                                 ativo: product.ATIVO,
                               no_site: product.NO_SITE 
                            });

                        for (const i of inputInsertVarianteLocal) {
                            const resultUpdateVarianteLocal = await variantesLocaisIntegration.insertOrUpdate({
                                erp_sku: Number(product.CODIGO),
                                estoque: i.estoque,
                                id_local_shopify: i.id_local_shopify,
                                id_local: i.id_local,
                                variante_id: variante_id,
                                inventoryItemId: String(inventoryItemId),
                                ultimo_envio_estoque: dateService.obterDataHoraAtual(),
                                     is_activate_inventory: i.is_activate_inventory

                            }
                            )
                        }


                        if (!resultInsertVariant.sucess) {
                            console.log("Erro ao tentar registrar variante no banco de dados ", resultInsertVariant.message)
                            log.status = "error"
                            log.message = "Erro ao tentar registrar variante no banco de dados "
                            return { sucess: false, message: "Erro ao tentar registrar variante no banco de dados " };
                        }
                    } else {
                        console.log(`[X] ocorreu um erro ao tentar registrar o produto na tabela produtos `)
                    }
                    log.status = 'sucess'
                    log.message = `Produto ${product.CODIGO} criado  com sucesso!`

                    if (product.NO_SITE === 'S') {
                        await publishProductService.publishProdutctChannel(product.CODIGO, true);
                    } else {
                        await publishProductService.publishProdutctChannel(product.CODIGO, false);
                    }

                    return { sucess: true, message: "Produto criado com sucesso!" };
                }
            }


        } catch (e: any) {
            console.error("Erro no serviço: ", e);
            log.status = "error"
            log.message = `ocorreu um erro ao tentar registrar o produto ${product.CODIGO}.`

            return { sucess: false, message: e.message }
        } finally {
            await logIntegration.insert(log)
        }
        return { sucess: false, message: 'message' }
    } finally {
        await produtoRepository.releaseLock(product.CODIGO);
    }
    }

 


}

