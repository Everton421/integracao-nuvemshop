
import test from 'node:test'
import { PhotosServicesFactory } from '../photos-service-factory.ts'
import { PhotosRepository } from '../photos-repository.ts';
import { conn2, database_api, db_publico, db_vendas } from '../../../database/database-connection.ts';




test("Teste envio de fotos ", async ()=>{

     const photosService = PhotosServicesFactory.createPhotosService();
     
     const photosRepository = new PhotosRepository(conn2, db_publico, database_api, db_vendas);

     const id_produto_nuvemshop= 372376153;
     const codigo_erp=72;
     try {
     
        const data = await photosRepository.findPhotosByParam( {  codigo_produto_erp :codigo_erp })
        if(data.length){
           await photosService.deletePhotos(codigo_erp, id_produto_nuvemshop);
        }

      await photosService.postBase64Photos(codigo_erp, id_produto_nuvemshop);
        } catch (error) {
            console.error(`Erro ao tentar enviar iamgem. `,error)

        }  
})