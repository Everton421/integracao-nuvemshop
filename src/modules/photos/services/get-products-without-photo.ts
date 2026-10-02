import { conn2, database_api } from "../../../database/database-connection.ts";
import { delay } from "../../../shared/utils/delay.ts";
import { GetShopifyPhotosProductsRequest } from "../request/get-shopify-photos-request.ts";

import { PostShopifyPhoto } from "../post-shopify-photo.ts";
import { FotosProdutoIntegration } from "../repository/photos-products-repository.ts";
import { getImagePostgres } from "./get-link-photos-postgres-service.ts";
import { UploadMediaForShopifyRequest } from "../request/upload-media-for-shopify-request.ts";
import { DowloadImage } from "./dowload-photo.ts";
import { GenerateImageHashService } from "./generate-image-hash-services.ts";
import { verificarImagem } from "../utils/check-image-web.ts";

type imageProductShopify = { 
    node: {
      url:  string,
      altText: string
    }
}

export class GetProductsWithoutPhoto { 


    private databaseApi = `\`${database_api}\``;
 
    async getByParams(query: {variante_id?: string, erp_sku?: number } ){
        const { variante_id, erp_sku} = query;

            const fotosProdutoIntegration = new FotosProdutoIntegration();


        let baseSql= `SELECT   variante_id,  erp_sku, id_produto_pai as shopify_product_id FROM ${this.databaseApi}.variantes    `;
        const params = []
        const values = []

        //let sql = `SELECT v.variante_id from ${this.databaseApi}.variantes v `;
        if( variante_id ) { 
            params.push(`    variante_id = ? `);
            values.push( variante_id );
        }

        if(erp_sku){
            params.push(`    erp_sku  = ? `);
            values.push( erp_sku );
        }
        const whereClause = " WHERE "

           const sql = baseSql + whereClause + params.join(' AND ') +   " group by  erp_sku";

        const [arrVariantId] = await conn2.query(sql,values);


        const arrVariant = arrVariantId as [ { variante_id:string, erp_sku:number,  shopify_product_id:string}]

            console.log(`[V] Consultando ${arrVariant.length} variantes...`)

        const getShopifyPhotosProducts = new  GetShopifyPhotosProductsRequest();
        const postShopifyPhoto = new PostShopifyPhoto();

            let quantityProcess = 0;
            const totalitens = arrVariant.length;

            for( const variant of arrVariant ){
                await delay(250);

                const {erp_sku, shopify_product_id, variante_id } = variant;

                // consulta as fotos na shopify. 
                const fotos = await getShopifyPhotosProducts.verifyShopifyPhotos(variante_id);

               if(!fotos.node || !fotos.node.sku || fotos.node.sku === null ){
                     console.log(`[X] Produto sem sku.`)
                    continue;
                }

                const sku = fotos.node.sku
                
                if(!fotos.node.product.id || fotos.node.product.id === null ){
                     console.log(`[X] Produto sem id.`)
                    continue;
                }

                const shopifyProductTitle = fotos.node.product.title;
                const imagens = fotos.node.product.images.edges as any[]

                        if(!imagens.length){
                            console.log(`Nenhuma foto encontrada para o produto ${erp_sku} na shopify...`);
                        
                            console.log(`Consultando fotos para enviar para o produto ${erp_sku} na shopify...`);
                                const arrPhotos = await fotosProdutoIntegration.selectPhotosOldSite({ sku:erp_sku});
                                if(arrPhotos.length > 0 ){
                                        const media = []
                                
                                        const photos = arrPhotos.filter((i)=>i.gallery);

                                        for( const photo of photos){
                                            media.push({ 
                                                originalSource: String(photo.gallery),
                                                alt:String(shopifyProductTitle),
                                                mediaContentType: "IMAGE"
                                            })
                                        }   

        
                                        //console.log(media)
                                        //const resultPostShopifyPhoto = undefined;

                                             const resultPostShopifyPhoto = await UploadMediaForShopifyRequest.appendMediaToShopify(shopify_product_id, media as any ,erp_sku);
                                        if(resultPostShopifyPhoto){
                                        await conn2.query(` DELETE FROM ${this.databaseApi}.produtos_sem_foto where erp_sku = '${erp_sku}'`)
                                        }
                                    }else{
                                        console.log(`Nenhuma foto encontradoa para o produto ${erp_sku} no banco de dados.`);
                                        await conn2.query(`INSERT INTO ${this.databaseApi}.produtos_sem_foto SET erp_sku = '${erp_sku}', shopify_product_id = '${shopify_product_id}'
                                        ON DUPLICATE KEY UPDATE shopify_product_id = '${shopify_product_id}'; `);
                                    } 
                        }else{
                            if(imagens.length > 0 ){
                             
                                console.log(`Fotos SKU ${sku}  `,imagens[0].node.url )
                                await conn2.query(` DELETE FROM ${this.databaseApi}.produtos_sem_foto where erp_sku = '${sku}'`)
                            }

                        }
                      quantityProcess++;
                    console.log(`[V] produtos processados ${quantityProcess} de ${totalitens} ...`);
            }  
               console.log(`[V] Fim do processo.`) 
    
    }



      async get( variante_id?: string  ){

            const fotosProdutoIntegration = new FotosProdutoIntegration();
            const dowloadImage = new DowloadImage();
            const generateImageHashService = new GenerateImageHashService();

        let baseSql= `SELECT  
                 v.variante_id,
                 v.erp_sku,
                 v.id_produto_pai as shopify_product_id
                 FROM ${this.databaseApi}.variantes v
                    join ${this.databaseApi}.variantes_locais vl on vl.erp_sku = v.erp_sku 
                 `;

        if( variante_id ) { 
              baseSql += `WHERE    v.variante_id = '${variante_id}'   `
            }
            baseSql += ` group by  vl.erp_sku `;
        const [arrVariantId] = await conn2.query(baseSql);

        const arrVariant = arrVariantId as [ { variante_id:string, erp_sku:number,  shopify_product_id:string}]

            console.log(`[V] Consultando ${arrVariant.length} variantes...`)

        const getShopifyPhotosProducts = new  GetShopifyPhotosProductsRequest();
        const postShopifyPhoto = new PostShopifyPhoto();

            let quantityProcess = 0;
            const totalitens = arrVariant.length;

            for( const variant of arrVariant ){
                await delay(250);

                const {erp_sku, shopify_product_id, variante_id } = variant;

                // consulta as fotos na shopify. 
                const fotos = await getShopifyPhotosProducts.verifyShopifyPhotos(variante_id);

               if(!fotos.node || !fotos.node.sku || fotos.node.sku === null ){
                     console.log(`[X] Produto sem sku.`)
                    continue;
                }

                const sku = fotos.node.sku
                
                if(!fotos.node.product.id || fotos.node.product.id === null ){
                     console.log(`[X] Produto sem id.`)
                    continue;
                }

                const shopifyProductTitle = fotos.node.product.title;
                const imagens = fotos.node.product.images.edges as imageProductShopify[]

                        if(!imagens.length){
                            console.log(`[X] Nenhuma foto encontrada para o produto ${erp_sku} na shopify...`);
                        
                            console.log(`[V] Consultando fotos para enviar para o produto ${erp_sku} na shopify...`);
                                 const photosPostgres = await getImagePostgres( Number(erp_sku) );
                                
                                if(photosPostgres.length > 0 ){
                                        const media = []
                                

                                        for( const photo of photosPostgres){
                                            media.push({ 
                                                  originalSource: String(photo),
                                                alt:String(shopifyProductTitle),
                                                mediaContentType: "IMAGE"
                                            })
                                        }   

                                        const resultPostShopifyPhoto = await UploadMediaForShopifyRequest.appendMediaToShopify(shopify_product_id, media as any ,erp_sku);

                                        if(resultPostShopifyPhoto){
                                            console.log(`[V] Fotos enviadas para o produto ${erp_sku}!   `)
                                            await conn2.query(` DELETE FROM ${this.databaseApi}.produtos_sem_foto where erp_sku = '${erp_sku}'`)
                                        
                                        }
                                    }else{
                                        console.log(`Nenhuma foto encontradoa para o produto ${erp_sku} no banco de dados.`);
                                        await conn2.query(`INSERT INTO ${this.databaseApi}.produtos_sem_foto SET erp_sku = '${erp_sku}', shopify_product_id = '${shopify_product_id}'
                                        ON DUPLICATE KEY UPDATE shopify_product_id = '${shopify_product_id}'; `);
                                    } 
                        }else{

                          

                        }
                      quantityProcess++;
                    console.log(`[V] produtos processados ${quantityProcess} de ${totalitens} ...`);
            }  
           return    console.log(`[V] Fim do processo.`) 
    
    }

} 