import { conn2, database_api } from '../../database/database-connection.ts'
import { NuvemshopApi } from '../../shared/api/api.ts'
import { DateService } from '../../shared/utils/date-service.ts'
import { ProductIntegration } from '../products/repository/produto-integration-repository.ts'
import { MappingInventory } from './inventory-mapping.ts'
import { InventoryRequest } from './inventory-request.ts'
import { InventoryService } from './inventory-service.ts'


export class InventoryServicesFactory{

    static createInventoryService(){

      const API_TOKEN:string = process.env.API_TOKEN!
        const API_BASE_URL:string = process.env.API_BASE_URL!
        const API_VERSION:string = process.env.API_VERSION!
        const ID_LOJA:string = process.env.ID_LOJA!
        const APPLICATION_URL:string = process.env.APPLICATION_URL!
        
        const nuvemshopApi = new NuvemshopApi(  API_BASE_URL,  API_VERSION,  ID_LOJA,  API_TOKEN,  APPLICATION_URL ); 
        const inventoryRequest = new InventoryRequest(nuvemshopApi.api);
        const productIntegration = new ProductIntegration(conn2, database_api);
        const mappingInventory= new MappingInventory();
           const dateService = new DateService();

        return new InventoryService(
                productIntegration,
               inventoryRequest,
                mappingInventory,
                dateService
        )
    }
}