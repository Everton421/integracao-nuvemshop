import { conn2, database_api } from "../../../database/database-connection.ts";
import { FotosProdutoIntegration } from "../repository/photos-products-repository.ts";
 

export async function getImageOldSite (erp_sku: number) {
     const database = `\`${database_api}\``;
 
    const fotosProdutoIntegration = new FotosProdutoIntegration();
    let imgsFinal: string[] = [];

    const photosOldSite = await fotosProdutoIntegration.selectPhotosOldSite({ sku: erp_sku});
    if (photosOldSite && photosOldSite.length > 0) {
        for(const photo of photosOldSite){
            const verifyPhotoOldSite = await fotosProdutoIntegration.selectByParam({ id_site_antigo: String(photo.id)});
            if(verifyPhotoOldSite.length > 0 ){
                if(verifyPhotoOldSite[0].link){
                    imgsFinal.push(verifyPhotoOldSite[0].link);
                } 
            }else{
                if(photo.link){

                    const sql = `INSERT INTO ${database}.fotos_produtos 
                                         SET
                                            erp_sku = '${erp_sku}',
                                            link   = '${photo.link}',
                                            id_site_antigo = '${photo.id}',
                                            ativo = 'S' 
                                            ON DUPLICATE KEY UPDATE  link = '${photo.link}', id_site_antigo = '${photo.id}'
                                         `;
                                          const [ resultInsertOrUpdateImg ] = await conn2.query(sql);
                    imgsFinal.push(photo.link);
                }

            }
        }
    } 


    return imgsFinal;
}
