import { conn2, database_api, db_publico } from '../../database/database-connection.ts'
import { CategoryErpRepository } from './repository/categoria-erp-repository.ts'
import { NuvemshopApi } from '../../shared/api/api.ts'
import { PostCategoryRequest } from './post-category-request.ts'
import { CategoriaIntegrationRepository } from './repository/categoria-integration-repository.ts'
 import { MappingCategory   } from './mapping-category.ts'
import { CategoryServices } from './category-services.ts'

export    class CategoryServiceFactory{
    static createCategoryService(): CategoryServices{

        const API_TOKEN:string = process.env.API_TOKEN!
        const API_BASE_URL:string = process.env.API_BASE_URL!
        const API_VERSION:string = process.env.API_VERSION!
        const ID_LOJA:string = process.env.ID_LOJA!
        const APPLICATION_URL:string = process.env.APPLICATION_URL!
        
         const nuvemshopApi = new NuvemshopApi(  API_BASE_URL,  API_VERSION,  ID_LOJA,  API_TOKEN,  APPLICATION_URL ); 
         const postCategoryRequest= new PostCategoryRequest(nuvemshopApi.api);
         const categoryIntegrationRepository = new CategoriaIntegrationRepository(conn2, database_api);
         const categoryErpRepository = new CategoryErpRepository(conn2, db_publico, database_api);
         const  mappingCategory = new MappingCategory();

        return new CategoryServices( categoryIntegrationRepository, postCategoryRequest, mappingCategory, categoryErpRepository)
    }

 }