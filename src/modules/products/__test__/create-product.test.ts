
import test from 'node:test'
import { NuvemshopApi } from '../../../shared/api/api.ts'
import { conn2 } from '../../../database/database-connection.ts'
import { PostProductRequest } from '../request/post-product-request.ts'
import { MappingProductToPost } from '../mapping/mapping-product-to-post.ts'

test("TEST create product",async ()=>{
        const url = process.env.API_BASE_URL!
        const  token = process.env.API_TOKEN!
        const  aplicationUrl = process.env.APPLICATION_URL!
        const  apiVersion = process.env.API_VERSION!
        const idLoja = process.env.ID_LOJA!

    
   const nuvemshopApi = new NuvemshopApi( url, apiVersion, idLoja, token,  aplicationUrl);

  //  try{
  //   const data = await nuvemshopApi.api.get('/products') 
  //       console.log(data.data)
  //  }catch(e){
  //      console.log( e );
  //  }

  const payload = MappingProductToPost.mapp();
        try{

            const data = await  PostProductRequest.post(nuvemshopApi.api, payload)
            console.log(data)
        
        }catch(e){
            console.log(e)
        }  

})  