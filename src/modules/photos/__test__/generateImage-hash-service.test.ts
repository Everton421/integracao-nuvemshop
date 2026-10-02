import test, { describe } from 'node:test'
import { GenerateImageHashService } from '../services/generate-image-hash-services.ts';
import { PgImagensProdutos } from '../repository/postgres-images-repository.ts';
import { conn2, database_api } from '../../../database/database-connection.ts';

describe("", async ()=>{
                
    test.it("",async ()=>{

    const generateImageHashService = new GenerateImageHashService();
               const hash = await generateImageHashService.fromUrl('https://i.ibb.co/8L7fy7nV/2f18acab4bd1.jpg');
    })
    

    test.it(async ()=>{

        try{
               const pgImagensProdutos = new PgImagensProdutos();
                const generateImageHashService = new GenerateImageHashService();

            const fotosNoPostgres = await pgImagensProdutos.find(String(35472));
              const hash = generateImageHashService.fromBase64(fotosNoPostgres![0].imagem);
            console.log(hash)

               const db = `\`${database_api}\``;
             const result = await conn2.query(`update ${db}.fotos_produtos set hash_sha256 = '${hash}' where id_postgres = '${fotosNoPostgres![0].id}';`)
            console.log(result)

        }catch(e){
            console.log(e)
        }
    })
})