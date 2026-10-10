import test from 'node:test';
import { InventoryServicesFactory } from '../inventory-services-factory.ts';
 
import { conn2, database_api, db_estoque, db_publico, db_vendas } from '../../../database/database-connection.ts';
import { ProductErpRepository } from '../../products/repository/produto-repository.ts';




test("inventory shipment test ", async ()=>{
      const productErpRepository = new ProductErpRepository(conn2, db_publico, database_api, db_estoque, db_vendas);
    const dataStock = await productErpRepository.findStock(840);
    
    const stock = dataStock[0].ESTOQUE;

    const servicesFactory = InventoryServicesFactory.createInventoryService();

    await servicesFactory.updateInventory( { code: 840, stock:stock })
    
})

test("Price submission test ", async ()=>{
      const productErpRepository = new ProductErpRepository(conn2, db_publico, database_api, db_estoque, db_vendas);
    const dataStock = await productErpRepository.findStock(840);
    
    const stock = dataStock[0].ESTOQUE;

    const servicesFactory = InventoryServicesFactory.createInventoryService();

    await servicesFactory.updateInventory( { code: 840, stock:stock })
    
})

