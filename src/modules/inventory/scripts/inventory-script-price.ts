import { conn2, database_api, db_estoque, db_publico } from "../../../database/database-connection.ts";
import { delay, type typeDelayFunction } from "../../../shared/utils/delay.ts";
import { InventoryRepository } from "../inventory-repository.ts";
import { InventoryService } from "../inventory-service.ts";
import { InventoryServicesFactory } from "../inventory-services-factory.ts";

export class SyncInventoryPrice{
        
     private inventoryRepository:InventoryRepository;
     private inventoryService:InventoryService
        private delay: typeDelayFunction;

     constructor( inventoryRepository:InventoryRepository, inventoryService:InventoryService , delay: typeDelayFunction){
         this.inventoryRepository=inventoryRepository;
         this.inventoryService=inventoryService;
          this.delay=delay ;
     }   

    async exec(){
        const dataPricesToshipping=  await this.inventoryRepository.findPriceProductToShipping();
        console.log(`[V] Enviando Precos...`)

        console.log(`[V]  Encontrado ${dataPricesToshipping.length} registros de preços.`)

        let processed = 1;
        for( const [ index, price ] of dataPricesToshipping.entries() ){

            if(Number(price.PRECO) != Number(price.ULTIMO_PRECO_ENVIADO) || Number(price.ULTIMO_PROMOCAO_ENVIADA) != Number(price.PROMOCAO) ){
             
                await this.delay(500, `Envio Preço [ ${processed} de ${dataPricesToshipping.length} ]...`)
                await this.inventoryService.updateInventory({ code: price.CODIGO, price: price.PRECO, promotion: price.PROMOCAO})
                processed++
            }
        }
            console.log(`[V] Fim do envio dos Preços!`)
        return;
    }
}


const inventoryService =  InventoryServicesFactory.createInventoryService()
const inventoryRepository = new InventoryRepository(conn2, db_publico, database_api, db_estoque, database_api);

const syncInventoryPrice = new SyncInventoryPrice( inventoryRepository, inventoryService, delay); 
 

await syncInventoryPrice.exec();


 