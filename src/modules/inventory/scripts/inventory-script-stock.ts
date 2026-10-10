import { conn2, database_api, db_estoque, db_publico, db_vendas } from "../../../database/database-connection.ts";
import { delay, type typeDelayFunction } from "../../../shared/utils/delay.ts";
import { InventoryRepository } from "../inventory-repository.ts";
import { InventoryService } from "../inventory-service.ts";
import { InventoryServicesFactory } from "../inventory-services-factory.ts";

export class SyncInventoryStock{

    private inventoryRepository:InventoryRepository;
    private inventoryService:InventoryService
        private delay: typeDelayFunction;

    constructor( inventoryRepository:InventoryRepository, inventoryService:InventoryService, delay: typeDelayFunction ){
        this.inventoryRepository=inventoryRepository;
        this.inventoryService=inventoryService;
        this.delay = delay;
    }   

    async exec(){
        const stockProductToShipping = await this.inventoryRepository.findStockProductToShipping();
         
             console.log(`[V] Enviando Estoque...`)

        console.log(`[V]  Encontrado ${stockProductToShipping.length} registros de estoque.`)
        let processed = 1;

            for(const [index , stock] of stockProductToShipping.entries() ){

                if(Number(stock.ESTOQUE) != Number(stock.ULTIMO_SALDO_ENVIADO)){
                    await this.delay(500, `Envio Estoque [ ${processed} de ${stockProductToShipping.length} ]...`)
                    await this.inventoryService.updateInventory({ code: stock.CODIGO, stock: stock.ESTOQUE  })
                }
                processed++
            }
            console.log(`[V] Fim do envio do Estoque !`)
            return
    }

}


const inventoryService =  InventoryServicesFactory.createInventoryService()
const inventoryRepository = new InventoryRepository(conn2,db_publico,database_api,db_estoque,db_vendas);


await new SyncInventoryStock( inventoryRepository, inventoryService, delay).exec();
