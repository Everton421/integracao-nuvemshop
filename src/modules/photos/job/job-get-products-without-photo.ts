import { GetProductsWithoutPhoto } from "../services/get-products-without-photo.ts";
import cron from 'node-cron';

export class JobProductsWithoutPhoto{

    static async getProducts(){
            const getProductsWithoutPhoto = new GetProductsWithoutPhoto();
            const VERIFICAR_FOTOS = process.env.VERIFICAR_FOTOS || '0 */4 * * *';

            let inExec =false;
        console.log(`[V] Agendado tarefa de verificação de fotos dos produtos.`)
            cron.schedule(VERIFICAR_FOTOS, async () => {
                 if (inExec) {
                         console.log("[X] Tarefa de verificação de produto ainda em execução.");
                         return;
                 }
                 try{
                    inExec = true;  
                        await getProductsWithoutPhoto.get();

                 }catch(e){
                    console.log(`[X] Erro na tarefa verificação de produtos sem foto. `,e  )
                 }finally{
                    inExec =false;
                 }
            
                    })

    }

    
}

