import { conn2, database_api } from "../../../database/database-connection.ts";
import { FotosProdutoIntegration } from "../repository/photos-products-repository.ts";
import { UploadImgsService } from "./upload-host-photos-services.ts";
import { PgImagensProdutos } from "../repository/postgres-images-repository.ts";
import { verificarImagem } from "../utils/check-image-web.ts";
import { delay } from "../../../shared/utils/delay.ts";
import { isAxiosError } from "axios";
import { GenerateImageHashService } from "./generate-image-hash-services.ts";

interface ImageCandidate {
    hash: string;
    base64: string;
    source: 'postgres' | 'site-antigo';
    id_postgres?: string;
}



export async function getImagePostgres(erp_sku: number) {
    const database = `\`${database_api}\``;

    const pgImagensProdutos = new PgImagensProdutos();
    const fotosProdutoIntegration = new FotosProdutoIntegration();
    const uploadImgsService = new UploadImgsService();
    let imgsFinal: string[] = [];

    const fotosNoPostgres = await pgImagensProdutos.find(String(erp_sku));

    if (fotosNoPostgres && fotosNoPostgres.length > 0) {
        for (const fotoPg of fotosNoPostgres) {
            
            const fotoPostgresEnviaAnteriormente = await fotosProdutoIntegration.selectByParam({ erp_sku: String(erp_sku), id_postgres: fotoPg.id });

            if (fotoPostgresEnviaAnteriormente.length > 0) {

                // verifica se a foto foi enviado anteriormente, se foi é verificado se é valida;
                if (fotoPostgresEnviaAnteriormente[0].link != null) {
        
                    // valida a imagen
                    const isValidLinkPhoto = verificarImagem(fotoPostgresEnviaAnteriormente[0].link)

                    // se nao for valida faz o upload novamente
                    if(!isValidLinkPhoto){
                        await delay(500, ' Upload de Imagen  ')
                        const link =await UploadHostAndInsertPhoto.exec(fotoPg.imagem, erp_sku, fotoPg.id );
                        if(link) imgsFinal.push(link);
                        }else{
                    // se for valida envia para o array de fotos        
                            imgsFinal.push(fotoPostgresEnviaAnteriormente[0].link);
                        }
                    
                } else {
                      await delay(500, ' Upload de Imagen  ')
                    const link =await UploadHostAndInsertPhoto.exec(fotoPg.imagem, erp_sku, fotoPg.id );
                       if(link) imgsFinal.push(link);

                }
            } else {
                      await delay(500, ' Upload de Imagen  ')
                const link =await UploadHostAndInsertPhoto.exec(fotoPg.imagem, erp_sku, fotoPg.id );
                       if(link) imgsFinal.push(link);
            }

        }

    } else {
    }


    return imgsFinal;
}

export class UploadHostAndInsertPhoto{

static async   exec(photo:string, erp_sku:number, pg_photo_id:string){

    const uploadImgsService = new UploadImgsService();
    const database = `\`${database_api}\``;
    let linkImgPostgres = null;
    let retries = 0;
    const maxRetries = 3;
    const generateImageHashService = new GenerateImageHashService();

    const hash = generateImageHashService.fromBase64(photo);

    while (retries < maxRetries) {
        try {
            // Upload para o ImgBB
            const link = await uploadImgsService.uploadIMGBB(photo);
            if (link) {
                linkImgPostgres = link;
                break; 
            }
            // Imagem inválida ou falha sem retry (429) -> falha definitiva
            break;
        } catch (e) {
            if (isAxiosError(e)) {
                if (e.response?.status === 429) {
                    const waitTime = (retries + 1) * 10000; // Espera 10s, 20s, 30s...
                    console.warn(`[!] Rate limit atingido (429). Aguardando ${waitTime/1000}s para tentar novamente...`);
                    await delay(waitTime, 'Retry envio Foto');
                    retries++;
                    continue;  
                }
            }
            console.error(`[X] Erro no upload (Tentativa ${retries + 1}):`, e);
            break; 
        }
    }

    if (linkImgPostgres) {
        const sql = `INSERT INTO ${database}.fotos_produtos 
             SET
                erp_sku = '${erp_sku}',
                link   = '${linkImgPostgres}',
                id_postgres = '${pg_photo_id}',
                ativo = 'S',
                hash_sha256 = '${hash}'
                ON DUPLICATE KEY UPDATE link = '${linkImgPostgres}', id_postgres = '${pg_photo_id}', hash_sha256 = '${hash}'
             `;
        await conn2.query(sql);
        console.log(`[OK] Produto ${erp_sku} - Imagem enviada.`);
        return linkImgPostgres;  
    } else {
        console.error(`[X] Falha definitiva após retries: Produto ${erp_sku} / Postgres ID: ${pg_photo_id}`);
        return null;
    }

}
}

