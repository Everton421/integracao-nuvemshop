import { conn2, database_api, db_estoque, db_publico, db_vendas } from "../../../database/database-connection.ts";
import { ProductServicesFactory } from "../product-services-factory.ts";
import { ProductErpRepository } from "../repository/produto-repository.ts";
import { SyncProductsCommand } from "../sync-products-command.ts";
 
import { ProductJob } from "./product-job.ts";

export class ProductJobFactory{
    static createJob(priceTable:number){
                 const productErpRepository = new ProductErpRepository(conn2, db_publico, database_api, db_estoque, db_vendas);
                 const productServices = ProductServicesFactory.createProductServices();
                 const scriptSyncProducts = new SyncProductsCommand( productServices, productErpRepository);
        return new ProductJob(  scriptSyncProducts, priceTable)
        
    }
}