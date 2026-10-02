 import test from 'node:test'
 import { MappingCategory, MappingCategoryToPost } from '../mapping/mapping-category.ts'
 import { type CategoriaErp } from '../../../shared/interfaces/categoria-integracao.ts'
import { PostCategoryRequest } from '../request/post-category-request.ts'
import { NuvemshopApi } from '../../../shared/api/api.ts'
import { type ResponseNuvemshopCategory, type PayloadPostCategory } from '../types/types-category-request.ts'
import { CategoriaIntegrationRepository } from '../repository/categoria-integration-repository.ts'
import { seed } from '../../../database/seed.ts'
import { CategoryErpRepository } from '../repository/categoria-erp-repository.ts'
import { conn2, database_api, db_publico } from '../../../database/database-connection.ts'
 
 function categoria(over: Partial<CategoriaErp> = {}): CategoriaErp {
     return {
         CODIGO: 10,
         NOME: 'Joias',
         COD_GRUPO: null,
         NO_SITE: 'S',
         IMPORTADO_SITE: 'N',
         ALTERADO_SITE: 'N',
         DATA_RECAD: '2026-01-01 00:00:00',
         ATIVO: 'S',
         ...over,
     }
 }
 



   class CategoryFactory{
    static createCategoryService(): CategoryService{

        const API_TOKEN:string = process.env.API_TOKEN!
        const API_BASE_URL:string = process.env.API_BASE_URL!
        const API_VERSION:string = process.env.API_VERSION!
        const ID_LOJA:string = process.env.ID_LOJA!
        const APPLICATION_URL:string = process.env.APPLICATION_URL!
        
         const nuvemshopApi = new NuvemshopApi(  API_BASE_URL,  API_VERSION,  ID_LOJA,  API_TOKEN,  APPLICATION_URL ); 
         const postCategoryRequest= new PostCategoryRequest(nuvemshopApi.api);
         const categoryIntegrationRepository = new CategoriaIntegrationRepository(conn2, database_api);
         const categoryErpRepository = new CategoryErpRepository(conn2, db_publico);
         const  mappingCategory = new MappingCategory();

        return new CategoryService( categoryIntegrationRepository, postCategoryRequest, mappingCategory, categoryErpRepository)
    }

 }

 /**
  * Services referente ao modulo de categorias
  */
  class CategoryService  {

        private categoriaIntegrationRepository: CategoriaIntegrationRepository;
        private postCategoryRequest:PostCategoryRequest;
        private mappingCategory:MappingCategory;
        private categoryErpRepository:CategoryErpRepository

        constructor( categoriaIntegrationRepository: CategoriaIntegrationRepository, 
            postCategoryRequest:PostCategoryRequest,
            mappingCategory: MappingCategory,
            categoryErpRepository:CategoryErpRepository
        ){
            this.categoriaIntegrationRepository = categoriaIntegrationRepository;
            this.postCategoryRequest =postCategoryRequest;
            this.mappingCategory =mappingCategory; 
            this.categoryErpRepository =categoryErpRepository; 
  
        }

   

    async execute(   erp_category_sku:number, forceUpdate:boolean = false ){
        
        try {

            const data = await this.categoryErpRepository.findErpCategoryByParams( { CODIGO: erp_category_sku, NO_SITE:'S'} );

            if(data.length){
                 const categoryErp = data[0];
                    // criar objeto de envio
                  const dataCategoryMapped =  this.mappingCategory.mappCategory(categoryErp)
                    // verifica se a categoria já foi enviada.
                  const dataIsShipped = await this.categoriaIntegrationRepository.checkShippmentstatus(erp_category_sku)

                if(dataIsShipped.length){
                    const {DATA_RECADASTRO } = categoryErp;
                    const { id_nuvemshop ,ultimo_envio  } = dataIsShipped[0];

                        if(forceUpdate){
                                const responsePutCategory = await this.postCategoryRequest.put<ResponseNuvemshopCategory>( id_nuvemshop, dataCategoryMapped );
                        }else{
                        // se a data de atualização da categoria do erp for maior que a de ultimo envio, faz atualização 
                            if(  new Date(DATA_RECADASTRO) >  new Date(ultimo_envio) ){
                                const responsePutCategory = await this.postCategoryRequest.put<ResponseNuvemshopCategory>( id_nuvemshop, dataCategoryMapped );
                              }
                        }
                      
                    //ja foi enviada

                }else{

                     const responseCreateCategory = await this.postCategoryRequest.post<ResponseNuvemshopCategory>(dataCategoryMapped);

                    
                }

            }
          

           //const responseCreateCategory = await this.postCategoryRequest.post<ResponseNuvemshopCategory>(payload);
           //  console.log(responseCreateCategory)
            //  await this.categoriaIntegrationRepository.insertOrUpdate({
            //  })
        } catch (error) {
            console.log(error);
        }

    }
 }

 test('mapeia grupo sem parent', async  () => {
     //const payload = MappingCategoryToPost.mappCategory(categoria())


     await seed();
//         const createCategoryService = CategoryFactory.createCategoryService();
// 
//         
//         const data = await createCategoryService.create({
//            name: {
//                pt: 'teste1'
//            },
//            description:{
//                pt: "teste1",
//            }
//         })
//
//         // dados retornados
//          const datareturning = 
//                {
//                id: 41323200,
//                parent: 0,
//                subcategories: [],
//                google_shopping_category: null,
//                created_at: '2026-10-02T13:24:06+00:00',
//                updated_at: '2026-10-02T13:24:06+00:00',
//                visibility: 'visible',
//                visibility_updated_at: null,
//                name: { pt: 'teste1' },
//                handle: { pt: 'teste1' },
//                description: { pt: 'teste1' },
//                seo_title: { pt: '' },
//                seo_description: { pt: '' }
//                }

 })
  
