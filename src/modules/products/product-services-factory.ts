import { conn2, database_api, db_estoque, db_publico, db_vendas } from "../../database/database-connection.ts";
import { NuvemshopApi } from "../../shared/api/api.ts";
import { DateService } from "../../shared/utils/date-service.ts";
import { CategoryServiceFactory } from "../categories/category-service-factory.ts";
import { CategoriaIntegrationRepository } from "../categories/repository/categoria-integration-repository.ts";
import { PhotosServicesFactory } from "../photos/photos-service-factory.ts";
import { MappingProductToPost } from "./mapping-product-to-post.ts";
import { ProductRequest } from "./product-request.ts";
import { ProductServices } from "./product-services.ts";
import { ProductIntegration } from "./repository/produto-integration-repository.ts";
import { ProductErpRepository } from "./repository/produto-repository.ts";


export class ProductServicesFactory {
  static createProductServices() {
    const productErpRepository = new ProductErpRepository(conn2, db_publico, database_api, db_estoque, db_vendas);
    const categoriaIntegrationRepository = new CategoriaIntegrationRepository(conn2, database_api);
    const produtoIntegration = new ProductIntegration(conn2, database_api);

    const mappingProductToPost = new MappingProductToPost();

    const API_TOKEN: string = process.env.API_TOKEN!
    const API_BASE_URL: string = process.env.API_BASE_URL!
    const API_VERSION: string = process.env.API_VERSION!
    const ID_LOJA: string = process.env.ID_LOJA!
    const APPLICATION_URL: string = process.env.APPLICATION_URL!
    const nuvemshopApi = new NuvemshopApi(API_BASE_URL, API_VERSION, ID_LOJA, API_TOKEN, APPLICATION_URL);

    const productRequest = new ProductRequest(nuvemshopApi.api)
    const categoryServices = CategoryServiceFactory.createCategoryService();
    const photosServices = PhotosServicesFactory.createPhotosService();
    const dateService = new DateService();


    return new ProductServices(
        productErpRepository,
        categoriaIntegrationRepository,
        mappingProductToPost,
        productRequest,
        produtoIntegration,
        categoryServices,
        photosServices,
        dateService
      )
  }
}