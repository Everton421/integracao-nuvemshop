import { type event } from '../../../shared/contracts/event.ts';
import { delay } from '../../../shared/utils/delay.ts';
import { ConfiguracoesIntegration } from '../../config-integration/configuracoes-integration-repository.ts';
import { SyncEstoqueLojaService } from '../../inventory/service/sync-estoque-loja-service.ts';
import { SyncEstoqueScService } from '../../inventory/service/sync-estoque-sc-service.ts';
import { GetProductsWithoutPhoto } from '../../photos/services/get-products-without-photo.ts';
import { ProductErpRepository } from '../repository/produto-repository.ts';
import { VarianteIntegration } from '../repository/variants-integration.ts';
import { SyncProductService } from '../services/sync-product-service.ts';


export class PublishProductByEvent {

        static async send(event: event) {
                const configuracoesIntegration = new ConfiguracoesIntegration();
                const produtoRepository = new ProductErpRepository();
                const syncProductService = new SyncProductService();
                const configCron = process.env.ATUALIZAR_PRODUTOS;
                const getProductsWithoutPhoto = new GetProductsWithoutPhoto();
                const varianteIntegration = new VarianteIntegration();

                if (!configCron) {
                        return console.log("é necessario configurar a variavel ENVIAR_PRODUTO com a expressao cron. ")
                }

                        try {
                                const config = await configuracoesIntegration.select();

                                let { atualizar_produtos, tabela_preco } = config[0];

                                if (atualizar_produtos !== 'S') {
                                        console.log(`[V] atualização de produtos desabilitada ...`);
                                        return;
                                };

                                const products = await produtoRepository.findSingleCompleteErpProduct(  event.id_registro , tabela_preco  );
                                console.log(`[V]  Enviando/atualizando produto ${event.id_registro} ...`);

                                if (products.length > 0) {
                                        console.log(`[V] Encontrado [${products.length}] Produtos...`);

                                        for (const product of products) {
 
                                                let shopifyId = product.id_produto_pai || undefined;
                                                let variantId = product.variante_id || undefined;


                                                  let imgsFinal:string[]=[];
                                   

                                                await delay(250, 'envio automático');
                                               const result = await syncProductService.post(product, imgsFinal, shopifyId, variantId);

                                                //  se retornar succes faz a validação das fotos.
                                                if(result && result?.sucess){
                                                        console.log(`[V] Verificando fotos do produto ${product.CODIGO}.`)
                                                        const  dataVariant = await varianteIntegration.selectBySkuErp(product.CODIGO);
                                                        if(dataVariant.length > 0 ){
                                                                const {variante_id } =dataVariant[0];
                                                                await getProductsWithoutPhoto.get(variante_id);
                                                        }
                                                }

                                                        // valida o estoque SC 
                                                if(result && result?.sucess){
                                                        await SyncEstoqueScService.postStockSC(product.CODIGO)

                                                } 

                                                if(result && result?.sucess){
                                                        await SyncEstoqueLojaService.postStockLoja(product.CODIGO)
                                                }                                                

                                        }
                                }

                        } catch (e) {
                                console.error("Erro no Job de Produtos:", e);
                        } finally {
                            
                        }
        }

}