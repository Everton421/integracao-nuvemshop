
import test from 'node:test';
 
import { conn2, database_api, db_estoque, db_publico, db_vendas } from '../../../database/database-connection.ts';
import { ProductServicesFactory } from '../product-services-factory.ts';
import { ProductIntegration } from '../repository/produto-integration-repository.ts';
import { ProductErpRepository } from '../repository/produto-repository.ts';

 


test(" teste sql produtos ", async ()=>{
  

    try {
      const productErpRepository = new ProductErpRepository(conn2, db_publico, database_api, db_estoque, db_vendas);

   const data = await productErpRepository.findStock(840);
        console.log(data);
    
  } catch (error) {
            console.log(error);
    }
 })