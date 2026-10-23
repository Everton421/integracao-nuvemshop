import { type typeDelayFunction } from "../../../shared/utils/delay.ts";
import { InventoryRepository } from "../inventory-repository.ts";
import { InventoryService } from "../inventory-service.ts";

export class SyncInventoryPrice{
        
     private inventoryRepository:InventoryRepository;
     private inventoryService:InventoryService
        private delay: typeDelayFunction;

     constructor( inventoryRepository:InventoryRepository, inventoryService:InventoryService , delay: typeDelayFunction){
         this.inventoryRepository=inventoryRepository;
         this.inventoryService=inventoryService;
          this.delay=delay ;
     }   

    async exec(table:number){
        // busca os preços que precisam ser atualizados
        const dataPricesToshipping=  await this.inventoryRepository.findUpdatedPrices(table);
        console.log(`[V] Enviando Precos...`)

        console.log(`[V]  Encontrado ${dataPricesToshipping.length} registros de preços.`)

        let processed = 1;
        for( const [ index, price ] of dataPricesToshipping.entries() ){
                await this.delay(500, `Envio Preço [ ${processed} de ${dataPricesToshipping.length} ]...`)
                const promotion = Number(price.PROMOCAO);
                
                await this.inventoryService.updateInventory({ code: price.CODIGO, price: price.PRECO, promotion})
                processed++
        }
            console.log(`[V] Fim do envio dos Preços!`)
        return;
    }
}

/*
const inventoryService =  InventoryServicesFactory.createInventoryService()
const inventoryRepository = new InventoryRepository(conn2, db_publico, database_api, db_estoque, database_api);

const syncInventoryPrice = new SyncInventoryPrice( inventoryRepository, inventoryService, delay); 
 

await syncInventoryPrice.exec(1);
 */