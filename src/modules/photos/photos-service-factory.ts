import { conn2, database_api, db_publico, db_vendas } from "../../database/database-connection.ts";
import { NuvemshopApi } from "../../shared/api/api.ts";
import { delay } from "../../shared/utils/delay.ts";
import { PhotosRepository } from "./photos-repository.ts";
import { PhotosRequest } from "./photos-request.ts";
import { PhotosService } from "./photos-service.ts";


export class PhotosServicesFactory{
    static createPhotosService(){
        const photosRepository = new PhotosRepository(conn2, db_publico, database_api, db_vendas);
            const API_TOKEN:string = process.env.API_TOKEN!
            const API_BASE_URL:string = process.env.API_BASE_URL!
            const API_VERSION:string = process.env.API_VERSION!
            const ID_LOJA:string = process.env.ID_LOJA!
            const APPLICATION_URL:string = process.env.APPLICATION_URL!
            const nuvemshopApi = new NuvemshopApi(  API_BASE_URL,  API_VERSION,  ID_LOJA,  API_TOKEN,  APPLICATION_URL ); 
            const  photosRequest = new PhotosRequest(nuvemshopApi.api); 

        return new PhotosService( photosRepository, photosRequest ,delay  )
    }
}