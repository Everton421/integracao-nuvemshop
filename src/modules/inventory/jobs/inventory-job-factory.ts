import { conn2, database_api, db_estoque, db_publico, db_vendas } from "../../../database/database-connection.ts";
import { delay } from "../../../shared/utils/delay.ts";
import { InventoryJob } from "./inventory-job.ts";
import { InventoryRepository } from "../inventory-repository.ts";
import { InventoryServicesFactory } from "../inventory-services-factory.ts";
import { SyncInventoryPrice } from "../commands/sync-inventory-script-price-command.ts";
import { SyncInventoryStock } from "../commands/sync-inventory-stock-command.ts";

export  class InventoryJobFactory{
 static   createJob(){

          const inventoryRepository = new InventoryRepository( conn2, db_publico, database_api, db_estoque, db_vendas);
          const inventoryService =  InventoryServicesFactory.createInventoryService();
          const syncInventoryPrice = new SyncInventoryPrice( inventoryRepository, inventoryService, delay);
          const syncInventoryStock = new SyncInventoryStock(inventoryRepository, inventoryService, delay);
        
        return new InventoryJob(
                syncInventoryPrice,
                syncInventoryStock,
        )
    }
}