
import { test } from 'node:test';
import { GetShopifyPhotosProductsRequest } from '../request/get-shopify-photos-request.ts';
import { GetProductsWithoutPhoto } from '../services/get-products-without-photo.ts';


test.it(" (test) verifyShopifyPhotos ", async () => {

        const verifyPhotos = new GetShopifyPhotosProductsRequest();
const getProdutosSemFoto = new GetProductsWithoutPhoto();


    const result = await getProdutosSemFoto.get( )
     

})