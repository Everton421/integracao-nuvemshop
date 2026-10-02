
import test from 'node:test';
import { PgImagensProdutos } from '../repository/postgres-images-repository.ts';

test("", async (t)=>{

  await  t.test( " teste ", async (  )=>{
        try{
                const obj = new PgImagensProdutos();
                const data = await obj.find('50005')
                    
                const imgs =[]
                for(const photo of data!  ){
                     console.log( photo.id)
                 ///   console.log( " ")
                  console.log( JSON.stringify(photo.imagem))
                   console.log( " ")
                 console.log( " ")
//                        imgs.push(photo.imagem)
                         
                    } 


        }catch(e:any){
            console.log(e.response)
        }
    })

})
