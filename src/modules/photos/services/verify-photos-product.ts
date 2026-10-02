import { GetShopifyPhotosProductsRequest } from "../request/get-shopify-photos-request.ts";
import { getImagePostgres } from "./get-link-photos-postgres-service.ts";


export class VerifyPhotosAndUpload{

    static async verify(erp_sku:number, variantId?:string, ){

        const getShopifyPhotosProducts  = new GetShopifyPhotosProductsRequest();
        let isValidPhotosShopify = false;
        const imgsFinal =[];

        if(variantId){
                 const resultPhotosShopify = await getShopifyPhotosProducts.verifyShopifyPhotos(variantId);
                     if(!resultPhotosShopify.node || !resultPhotosShopify.node.sku || resultPhotosShopify.node.sku === null ){
                            console.log(`[X] Produto sem sku.`)
                  
                        }
                            if(!resultPhotosShopify.node.product.id || resultPhotosShopify.node.product.id === null ){
                                console.log(`[X] Produto sem id.`)
                             
                            }
                            
                         const  photosShopify = resultPhotosShopify.node?.product?.images?.edges as any[]

                        if(!photosShopify.length){
                            console.log("[X] Produto foi enviado sem foto.")
                        }else{
                            isValidPhotosShopify = true 
                        }

                           if(!isValidPhotosShopify ){
                                   const photosPostgres = await getImagePostgres( Number(erp_sku) );
                                             // imgsFinal.push(data.map( (i)=> i )); 
                                             if(photosPostgres && photosPostgres.length > 0 ){
                                                for( const photos of photosPostgres ) {
                                                   imgsFinal.push(photos); 
                                                }
                                             }
                         }
                }else{
                        const photosPostgres = await getImagePostgres( Number(erp_sku) );
                                             // imgsFinal.push(data.map( (i)=> i )); 
                                             if(photosPostgres && photosPostgres.length > 0 ){
                                                for( const photos of photosPostgres ) {
                                                   imgsFinal.push(photos); 
                                                }
                                             }
                }
       
                         return imgsFinal;

    }
}