import { conn2, database_api, db_publico } from "../../../database/database-connection.ts";
import { delay } from "../../../shared/utils/delay.ts";
import { CategoryServiceFactory } from "../category-service-factory.ts";
import { CategoryErpRepository } from "../repository/categoria-erp-repository.ts";
import { SyncCategoriesCommand } from "../sync-categories-command.ts";
import { JobCategories } from "./job-categories.ts";

export class JobCategoriesFactory{

    static createJob(){
        const categoryServices = CategoryServiceFactory.createCategoryService();
        const categoryErpRepository = new CategoryErpRepository(conn2, db_publico, database_api);
        const syncCategoriesCommand = new SyncCategoriesCommand( categoryErpRepository, categoryServices,  delay );
        return new JobCategories( syncCategoriesCommand );
    }
}