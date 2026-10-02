
import describe, { test } from 'node:test';
import { DeleteMediaRequest } from '../request/delete-media-request.ts';
import { GetShopifyPhotosProductsRequest } from '../request/get-shopify-photos-request.ts';

    test.it( "delete media from shopify",async ()=>{
        const deleteMediaRequest = new DeleteMediaRequest();
      
        const getShopifyPhotosProductsRequest = new GetShopifyPhotosProductsRequest();
        const resultPhotosProducts = await  getShopifyPhotosProductsRequest.getProductsMedia('gid://shopify/Product/15638258352294')
        if(resultPhotosProducts){
           //  console.log(resultPhotosProducts.product.media.nodes);
    
            const images = resultPhotosProducts.product.media.nodes;
            const mediaIds = images.map((i)=> i.id);
              console.log(mediaIds);
                await deleteMediaRequest.deleteMediaFromShopify('gid://shopify/Product/15638258352294', mediaIds)
        } 
        
    })