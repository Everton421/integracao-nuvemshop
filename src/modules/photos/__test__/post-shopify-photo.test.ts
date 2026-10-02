
import test from 'node:test';
import { PostShopifyPhoto } from '../post-shopify-photo.ts';


test.it( " teste ", async (  )=>{
    const p  = new PostShopifyPhoto();

    try{
       await p.postphotosbyOldSite(48901); 

    }catch(e:any){
        console.log(e.response)
    }
})

