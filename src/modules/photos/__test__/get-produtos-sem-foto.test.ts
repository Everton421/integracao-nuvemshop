


import { test } from 'node:test';

import { GetProductsWithoutPhoto } from '../services/get-products-without-photo.ts';

//    test.it(" (test) getProdutosSemFoto.getByParams ", async () => {
//        const getProdutosSemFoto = new GetProductsWithoutPhoto();
//        await getProdutosSemFoto.getByParams({erp_sku: 11482});
//    })

test.it(" (test) getProdutosSemFoto.get ", async () => {
    const getProdutosSemFoto = new GetProductsWithoutPhoto();
       await getProdutosSemFoto.get('gid://shopify/ProductVariant/56905632350374');

})