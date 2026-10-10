import { conn2, database_api, db_publico } from "../../database/database-connection.ts";
import { delay, type typeDelayFunction } from "../../shared/utils/delay.ts";
import { CategoryServiceFactory } from "./category-service-factory.ts";
import { CategoryErpRepository } from "./repository/categoria-erp-repository.ts";
import { CategoryServices } from "./category-services.ts";

/**
 * Executa o envio/atualização das categorias e subcategorias do ERP.
 */
export class SyncCategories{
    
            private categoryErpRepository:CategoryErpRepository;
            private categoryServices :CategoryServices;
           private delay : typeDelayFunction
    
            constructor( categoryErpRepository:CategoryErpRepository, categoryServices :CategoryServices, delay : typeDelayFunction){
                this.categoryErpRepository =categoryErpRepository; 
                this.categoryServices =categoryServices; 
                this.delay =delay 
            }   

    /**
     * Execute o envio das Categorias.
     * @param ms Tempo de intervalo entre as request, valor em milisegundos, Ex.: 1000 ( 1 segundo )
     */        
    async executeCategory (ms: number = 1000){
          const dataCategoriesToSend  = await this.categoryErpRepository.checkCategoriesForUpdates();
                      console.log(`[!] ${dataCategoriesToSend.length} Categorias para  envio. `)
                      for( const category of dataCategoriesToSend ){
                             await this.delay(ms, `Envio Categoria: ${category.NOME}`);
                            await this.categoryServices.syncCategory(category.CODIGO, true );
                        }
                }
     /**
     * Execute o envio das SubCategorias.
     * @param ms Tempo de intervalo entre as request, valor em milisegundos, Ex.: 1000 ( 1 segundo )
     */  
      async executeSubCategories (ms: number = 1000 ){
                     const dataSubCategoriesToSend  = await this.categoryErpRepository.checkSubCategoriesForUpdates();
                      console.log(`[!] ${dataSubCategoriesToSend.length} SubCategorias para  envio. `)
                        for( const subCategory of dataSubCategoriesToSend ){
                             await this.delay(ms, `Envio SubCategoria: ${subCategory.DESCRICAO}`);
                            await this.categoryServices.syncSubCategory(subCategory.CODIGO, true );
                        }
                }
}

const service  =    CategoryServiceFactory.createCategoryService() ;
const repo =   new CategoryErpRepository(conn2, db_publico, database_api);
 const up =  new SyncCategories(  repo,  service,  delay );


 await up.executeCategory(500);
 await up.executeSubCategories(500);
