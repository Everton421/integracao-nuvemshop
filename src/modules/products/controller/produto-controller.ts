import { type Request, type Response } from "express";
import { ConfiguracoesIntegration } from "../../config-integration/configuracoes-integration-repository.ts";
import { FotosProdutoIntegration } from "../../photos/repository/photos-products-repository.ts";
import { ProductErpRepository } from "../repository/produto-repository.ts";

import { type ICompleteProduct } from "../../../shared/interfaces/cad_prod.ts";
import { type LogsIntegracao } from "../../../shared/interfaces/logs-integracao.ts";
import { LocaisIntegration } from "../../inventory/repository/locais-integration-repository.ts";
 
import { GetProductsWithoutPhoto } from "../../photos/services/get-products-without-photo.ts";
import { VarianteIntegration } from "../repository/variants-integration.ts";
import { SyncProductService } from "../services/sync-product-service.ts";
import { SyncEstoqueScService } from "../../inventory/service/sync-estoque-sc-service.ts";
import { SyncEstoqueLojaService } from "../../inventory/service/sync-estoque-loja-service.ts";

type form_img = {
    conteudo: string
    tipo: 'url' | 'base64'
    id_postgres: string
}

type productEdit = ICompleteProduct & { ESTOQUE: number, IMAGENS_DATA: form_img[] }

export class ProdutoController {

    async syncProduct(req: Request, res: Response) {
        function delay(ms: number) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        const configuracoesIntegration = new ConfiguracoesIntegration();
        const productRepository = new ProductErpRepository();
        const syncProductService = new SyncProductService();
        const locaisIntegration = new LocaisIntegration();
        const varianteIntegration = new VarianteIntegration();
         const getProductsWithoutPhoto = new GetProductsWithoutPhoto();

        const arrproducts = req.body.produtos as string[];
        let log = { action: '', referencia: 'product', message: '', referencia_id: 0, status: 'sucess', dados_shopify: '' } as Omit<LogsIntegracao, 'id' | 'created_at'>;

        const resultConfig = await configuracoesIntegration.select();
        let tabela = undefined;

        if (!resultConfig.length) return res.status(400).json({ sucess: false, message: "Integração Não possui registro de configuração" });
        if (resultConfig.length > 0 && resultConfig[0].tabela_preco) tabela = resultConfig[0].tabela_preco;
    //    if (resultConfig.length > 0 && resultConfig[0].enviar_produtos && resultConfig[0].enviar_produtos === 'N') return res.status(400).json({ sucess: false, message: "Integração nao esta habilitada para enviar/atualizar produtos" });
        if (!Array.isArray(arrproducts)) return res.status(400).json({ sucess: false, message: "É necessario informar um array com os codigo dos itens" });
        if (Array.isArray(arrproducts) && arrproducts.length === 0) return res.status(400).json({ sucess: false, message: "Nenhum item selecionado" });

        let reponseMessage = '';

        for (const i of arrproducts) {
            const resultProductCompleteProduct = await productRepository.findSingleCompleteErpProduct(Number(i), tabela);

            const { CODIGO } = resultProductCompleteProduct[0];

            const arrLocation = await locaisIntegration.selectAll();

            if (!arrLocation.length) return res.status(400).json({ sucess: false, message: "Não encontrado local para efetuar o envio" });

            if (resultProductCompleteProduct.length > 0) {
                const erp_sku = String(CODIGO);

                // variaveis que determinam se o produto já foi enviado anteriormente.
                let shopifyId = undefined;
                let variantId = undefined;

                const produtoIntegrado = await varianteIntegration.selectBySkuErp(Number(i));
                if (produtoIntegrado.length > 0) {
                    shopifyId = produtoIntegrado[0].id_produto_pai;
                    variantId = produtoIntegrado[0].variante_id;
                }

                console.log(`Processando produto ${erp_sku}...`);
                await delay(250);


                let imgsFinal:string[]=[];

    

              const resultPostProduct = await syncProductService.post(resultProductCompleteProduct[0], imgsFinal, shopifyId, variantId);


                    /// faz a verificação das fotos.
                      if(resultPostProduct && resultPostProduct?.sucess){
                                                        console.log(`[V] Verificando fotos do produto ${CODIGO}.`)
                                                        const  dataVariant = await varianteIntegration.selectBySkuErp(CODIGO);
                                                        if(dataVariant.length > 0 ){
                                                                const {variante_id } =dataVariant[0];
                                                                await getProductsWithoutPhoto.get(variante_id);
                                                        }
                                                }
                                                  // valida o estoque SC 
                                                                   if(resultPostProduct && resultPostProduct?.sucess){
                                                                              await SyncEstoqueScService.exec(CODIGO);
                                                                      } 
                                                 // valida estoque loja                     
                                                                     if(resultPostProduct && resultPostProduct?.sucess){
                                                                              await SyncEstoqueLojaService.exec(CODIGO);
                                                                      }                          


              //  const resultPostProduct = {sucess:true, message:"teste" }
                if (!resultPostProduct) {
                    console.error(`Erro ao postar produto ${erp_sku}`);
                    continue; // Pula para o próximo produto em caso de erro individual
                }

                if (resultPostProduct.sucess) {

                    reponseMessage += `[${erp_sku}]: ${resultPostProduct.message}; `;
                } else {
                    console.log(`Erro no SKU ${erp_sku}: ${resultPostProduct.message}`);
                    reponseMessage += `[${erp_sku}]: Erro - ${resultPostProduct.message}; `;
                }
 
            } else {
                reponseMessage += `[SKU ${i}]: Não encontrado no ERP; `;
            }
        }

        return res.status(200).json({ sucess: true, message: reponseMessage });
    }

   

    async allProducts(req: Request, res: Response) {
        try {
            const configuracoesIntegration = new ConfiguracoesIntegration();
            const arrConfig = await configuracoesIntegration.select();

            let tabela = 0;
            const { tabela_preco } = arrConfig[0];
            if (tabela_preco > 0) tabela = tabela_preco;

            const produtoRepository = new ProductErpRepository();
            const fotosProdutosIntegration = new FotosProdutoIntegration();

            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 20;
            const search = req.query.search || '' as any;

            const sync_status = req.query.sync_status || 'synced' as any;

            const offset = (page - 1) * limit;


            let [produtos, totalRegistros, grupos, subgrupos] = await Promise.all([

                produtoRepository.searchSyncedProductErp({ limit: limit, offset: offset, priceTable: tabela, search: search, syncStatus: sync_status }),

                produtoRepository.countTotalProductsErp({ priceTable: tabela, search: search, syncStatus: sync_status }),
                 produtoRepository.findGroupErp(),
                produtoRepository.findSubGroupErp() 

            ]);

            const totalPages = Math.ceil(totalRegistros / limit);




            res.render('produtos', {
                produtos: produtos,
                grupos:grupos,
                subgrupos: subgrupos,
                pagination: {
                    page: page,
                    limit: limit,
                    totalRegistros: totalRegistros,
                    totalPages: totalPages
                },
                filters: {
                    search: search,
                    sync_status: sync_status
                }
            });

        } catch (error) {
            console.error("Erro ao carregar produtos:", error);
            res.status(500).send("Erro interno");
        }
    }

    /*
    async bulkGlobalAction(req: Request, res: Response) {
        const { acao, filters } = req.body;
        const productRepository = new ProductErpRepository();
        const configuracoesIntegration = new ConfiguracoesIntegration();
        const locaisIntegration = new LocaisIntegration();
        const varianteIntegration = new VarianteIntegration();
        const syncProductService = new SyncProductService();
        const produtosIntegration = new ProdutoIntegration();
        const publishProductService = new PublishProductService();
        const canaisVendaIntegration = new CanaisVendaIntegration();
        const arrChannel = await canaisVendaIntegration.selecByParam({ name: 'Online Store' });
        const todosProdutos = await productRepository.findProductsErp();
            const fotosProdutosIntegration = new FotosProdutoIntegration();

        let tabela = undefined;
        const resultConfig = await configuracoesIntegration.select();
        if (resultConfig.length > 0 && resultConfig[0].tabela_preco) tabela = resultConfig[0].tabela_preco;

        try {
            switch (acao) {
                case 'sync-all':

                    // Chama a lógica de envio completo
                    for (const i of todosProdutos) {
                        const resultProduct = await productRepository.findSingleCompleteErpProduct(Number(i.CODIGO), tabela);
                        const arrLocation = await locaisIntegration.selectAll();
                        const canaisVendaIntegration = new CanaisVendaIntegration();

                        if (!arrLocation.length) return res.status(400).json({ sucess: false, message: "Não encontrado local para efetuar o envio" });

                        if (resultProduct.length > 0) {
                            const erp_sku = String(resultProduct[0].CODIGO);
                            let shopifyId = undefined;
                            let variantId = undefined;

                            const produtoIntegrado = await varianteIntegration.selectBySkuErp(Number(i.CODIGO));
                            if (produtoIntegrado.length > 0) {
                                shopifyId = produtoIntegrado[0].id_produto_pai;
                                variantId = produtoIntegrado[0].variante_id;
                            }

                            console.log(`Processando produto ${erp_sku}...`);
                            await delay(250);
                        //    let imgsFinal = await getImagesService(Number(erp_sku));

                                const photosOldSite = await   fotosProdutosIntegration.selectPhotosOldSite({ sku: Number(erp_sku) })
                                  let imgsFinal = photosOldSite.map(v => `${v.gallery}`) || [];
              
                            const resultPostProduct = await syncProductService.post(resultProduct[0], imgsFinal, shopifyId, variantId);
                        }
                    }
                    break;
                case 'canais-all':

                    for (const i of todosProdutos) {

                        const id_channel_shopify = arrChannel[0].id_shopify;
                        const arrProductIntegration = await produtosIntegration.selectByParam({
                            erp_sku: String(i.CODIGO)
                        })
                        const { shopify_product_id } = arrProductIntegration[0];

                        await publishProductService.publish(shopify_product_id, id_channel_shopify)
                    }
                    break;
            }

            return res.json({ sucess: true, message: ` produtos processados com sucesso.` });
        } catch (err: any) {
            console.log("Erro no processamento massivo de produtos.", err)
            return res.status(500).json({ sucess: false, message: err.message });
        }
    }

     async syncSingleProduct(req: Request, res: Response) {
        const database = `\`${database_api}\``

        const syncProductService = new SyncProductService();
        const locaisIntegration = new LocaisIntegration();
        const postImgService = new PostImgService();
        const fotosProdutoIntegration = new FotosProdutoIntegration();
        const logIntegration = new LogsIntegration();

        const arrLocation = await locaisIntegration.selectAll();
        if (!arrLocation.length) return res.status(400).json({ sucess: false, message: " nao encontrado local para efetuar o envio do produto" })


        let product = req.body as productEdit;
        const imgs = (product.IMAGENS_DATA && product.IMAGENS_DATA.length > 0) ? product.IMAGENS_DATA : []

        let postImgs: any[] = []


        for (const i of imgs) {
            if (i.tipo === 'url') {
                postImgs.push(i.conteudo);
            }
            else if (i.tipo === 'base64') {
                // Se cair aqui, é uma imagem nova (do PC ou do Postgres que ainda não subiu)
                let novaUrl = null;
          
                    try {
                        novaUrl = await postImgService.postIMGBB(i.conteudo) as string;
                    } catch (e2) {
                        console.log(`ImgBB também falhou para SKU ${product.CODIGO}`);
                        await logIntegration.insert({
                            action: '',
                            dados_shopify: '',
                            message: `ImgBB falhou ao registrar a foto do produto ${product.CODIGO} | ${e}`,
                            referencia: 'photo',
                            referencia_id: 0,
                            status: 'error'
                        })
                    }
                

                if (novaUrl) {
                    // SALVA NO MYSQL para não precisar subir de novo na próxima vez

                    const sql = `INSERT INTO ${database}.fotos_produtos 
                                                 SET
                                                    erp_sku = '${product.CODIGO}',
                                                    link   = '${novaUrl}',
                                                    id_postgres = '${i.id_postgres}',
                                                    ativo = 'S' 
                                                    ON DUPLICATE KEY UPDATE  link = '${novaUrl}', id_postgres = '${i.id_postgres}'
                                                 `
                    const [resultInsertOrUpdateImg] = await conn2.query(sql);
                    postImgs.push(novaUrl);
                }
            }
        }

        console.log(postImgs);
       
            let reponseMessage = '';
            const variante_id = (!product.variante_id || product.variante_id === '') ? undefined : product.variante_id;
    
            const id_produto_pai = (!product.id_produto_pai || product.id_produto_pai === '') ? undefined : product.id_produto_pai;
    
            await delay(500);
    
            const resultPostProduct = await syncProductService.post(product, postImgs, id_produto_pai, variante_id)
            if (!resultPostProduct.sucess) return res.status(400).json({ sucess: false, message: "Algo de inesperado ocorreu com o serviço dos produtos" })
    
    
            if (resultPostProduct.sucess) {
                reponseMessage = reponseMessage + resultPostProduct.message;
            } else {
                console.log(resultPostProduct.message)
                return res.status(400).json({ sucess: false, message: resultPostProduct.message })
            }
    
        
        return res.status(200).json({ sucess: true, message: reponseMessage })

    }
*/
   
}

