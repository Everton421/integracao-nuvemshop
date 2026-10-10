import { MappingCategory } from "./mapping-category.ts";
import { CategoryErpRepository } from "./repository/categoria-erp-repository.ts";
import { CategoriaIntegrationRepository } from "./repository/categoria-integration-repository.ts";
import { PostCategoryRequest } from "./post-category-request.ts";
import { type ResponseNuvemshopCategory } from "./types/types-category-request.ts";

  export class CategoryServices  {

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

   /**
    *  CRIA/ATUALIZA categoria na Nuvemshop.  
    * @param skuCategoryErp Código da categoria no ERP.
    * @param forceUpdate Parâmetro que determina se deve ser feita atualização forçada na nuvemshop. 
    */
    async syncCategory( skuCategoryErp:number, forceUpdate:boolean = false ){
        
        try {

            const data = await this.categoryErpRepository.findCategoryErpByParams( { CODIGO: skuCategoryErp, NO_SITE:'S'} );
            let resultFunction :{success: boolean, message: string, data: any } = {success: false, message:'', data:null}  ; 

            if(data.length){
                 const categoryErp = data[0];
                    // criar objeto de envio
                  const dataCategoryMapped =  this.mappingCategory.mappCategory(categoryErp)
                    // verifica se a categoria já foi enviada.
                  const dataIsShipped = await this.categoriaIntegrationRepository.checkShippmentstatus(skuCategoryErp,'grupo')

                if(dataIsShipped.length){
                    const {DATA_RECAD  } = categoryErp;
                    const { id_nuvemshop ,ultimo_envio, nome  } = dataIsShipped[0];

                            if(forceUpdate){
                                    const responsePutCategory = await this.postCategoryRequest.put<ResponseNuvemshopCategory>( id_nuvemshop, dataCategoryMapped );
                                      await this.categoriaIntegrationRepository.partialUpdate({
                                            nome: nome,
                                            ultimo_envio: DATA_RECAD
                                        }, 'codigo_erp', skuCategoryErp);

                                      resultFunction.data= responsePutCategory;
                                       
                            }else{
                            // se a data de atualização da categoria do erp for maior que a de ultimo envio, faz atualização 
                                if(  new Date(DATA_RECAD) >  new Date(ultimo_envio) ){
                                    const responsePutCategory = await this.postCategoryRequest.put<ResponseNuvemshopCategory>( id_nuvemshop, dataCategoryMapped );
                                       await this.categoriaIntegrationRepository.partialUpdate({
                                            nome: nome,
                                            ultimo_envio: DATA_RECAD
                                        }, 'codigo_erp', skuCategoryErp);

                                      resultFunction.data= responsePutCategory;
                                }
                            }
                            resultFunction.success = true;
                            return resultFunction;
                }else{

                     const responseCreateCategory = await this.postCategoryRequest.post<ResponseNuvemshopCategory>(dataCategoryMapped);
                        await this.categoriaIntegrationRepository.insert({
                            codigo_erp: skuCategoryErp,
                            codigo_erp_pai: null,
                            id_nuvemshop: String(responseCreateCategory.id),
                            nivel: 'grupo',
                            nome: responseCreateCategory.name.pt,
                            parent_id_nuvemshop: null,
                            dados_categoria:  JSON.stringify(dataCategoryMapped), 
                            ultimo_envio: categoryErp.DATA_RECAD
                        })
                           resultFunction.success = true;
                           resultFunction.data= responseCreateCategory;
                           return resultFunction;
                }
            }else{
              resultFunction.success = false;
              resultFunction.message=`[V] categoria ${skuCategoryErp} não foi encontrada!`;
              return resultFunction;
            }
          
        } catch (error) {
            console.log(error);
            throw error;
        }

    }
 
    /**
    *  CRIA/ATUALIZA subcategoria na Nuvemshop.  
     * @param skuSubCategoryErp Código da subcategoria no ERP.
     * @param forceUpdate Parâmetro que determina se deve ser feita atualização forçada na nuvemshop. 
     */
    async syncSubCategory(   skuSubCategoryErp:number, forceUpdate:boolean = false ){
        
        try {

            const dataSubcategoryErp = await this.categoryErpRepository.findSubCategoryErpByParams( { CODIGO: skuSubCategoryErp, NO_SITE:'S'} );
            let resultFunction :{success: boolean, message: string, data: any } = {success: false, message:'', data:null}  ; 

            if(dataSubcategoryErp.length){
                 const subcategoryErp = dataSubcategoryErp[0];
                    const { COD_GRUPO } = subcategoryErp ;

                    // dados do grupo ( PAI ). Verifica se ja foi enviada.
                  const dataCategoryIsShipped = await this.categoriaIntegrationRepository.checkShippmentstatus(COD_GRUPO, 'grupo')

                    if(dataCategoryIsShipped.length){
                        // ID da categoria ( PAI ) 
                       const { id_nuvemshop: idCategoryNumvemshop   } = dataCategoryIsShipped[0];

                      // Criar objeto de envio
                      const dataSubCategoryMapped =  this.mappingCategory.mappSubCategory(subcategoryErp, Number(idCategoryNumvemshop) );

                        //Verifica se a subcategoria já foi enviada.
                      const dataSubCategoryIsShipped = await this.categoriaIntegrationRepository.checkShippmentstatus(skuSubCategoryErp, 'subgrupo')

                        if(dataSubCategoryIsShipped.length){
                            const { DATA_RECAD  } = subcategoryErp;
                            const { ultimo_envio, nome ,id_nuvemshop: idSubCategoryNuvemshop }=dataSubCategoryIsShipped[0];
                            console.log(`[!] Subcategoria [ ${nome} ] já foi enviada`)


                                   if(forceUpdate){
                                            const responsePutSubCategory = await this.postCategoryRequest.put<ResponseNuvemshopCategory>( idSubCategoryNuvemshop, dataSubCategoryMapped );
                                                   await this.categoriaIntegrationRepository.partialUpdate({
                                                        nome: responsePutSubCategory!.name.pt,
                                                        parent_id_nuvemshop: String(responsePutSubCategory.parent),
                                                        ultimo_envio: DATA_RECAD,
                                                        dados_categoria:  JSON.stringify(dataSubCategoryMapped), 
                                                    }, 'codigo_erp', skuSubCategoryErp);
                                               resultFunction.success = true;
                                               resultFunction.message=`[V] SubCategoria ${nome} atualizada com sucesso.`;
                                               resultFunction.data= responsePutSubCategory;
                                    }else{

                                    // se a data de atualização da categoria do erp for maior que a de ultimo envio, faz atualização 
                                        if(  new Date(DATA_RECAD) >  new Date(ultimo_envio) ){
                                            const responsePutCategory = await this.postCategoryRequest.put<ResponseNuvemshopCategory>( idSubCategoryNuvemshop, dataSubCategoryMapped );
                                                     await this.categoriaIntegrationRepository.partialUpdate({
                                                        nome: responsePutCategory!.name.pt,
                                                        ultimo_envio: DATA_RECAD,
                                                        parent_id_nuvemshop: String(responsePutCategory.parent),
                                                        dados_categoria:  JSON.stringify(dataSubCategoryMapped), },
                                                         'codigo_erp', skuSubCategoryErp
                                                        );
                                               resultFunction.success = true;
                                               resultFunction.message=`[V] SubCategoria ${nome} atualizada com sucesso.`;
                                               resultFunction.data= responsePutCategory;
                                        }
                                               resultFunction.success = true;
                                    }
                           
                                    return resultFunction;
                        }else{

                            const responseCreateCategory = await this.postCategoryRequest.post<ResponseNuvemshopCategory>(dataSubCategoryMapped);
                            await this.categoriaIntegrationRepository.insert({
                                codigo_erp: skuSubCategoryErp,
                                codigo_erp_pai: null,
                                id_nuvemshop: String(responseCreateCategory.id),
                                nivel: 'subgrupo',
                                nome: responseCreateCategory.name.pt,
                                parent_id_nuvemshop: null,
                                dados_categoria:  JSON.stringify(dataSubCategoryMapped), 
                                ultimo_envio: subcategoryErp.DATA_RECAD
                            })

                             resultFunction.success = true;
                             resultFunction.message=`[V] SubCategoria ${responseCreateCategory.name.pt} enviada com sucesso.`;
                             resultFunction.data= responseCreateCategory;
                             return resultFunction;
                        
                        }
               }else{
                     resultFunction.success = true;
                     resultFunction.message=`[V]  categoria ${COD_GRUPO} não foi encontrada para envio do subgrupo ${skuSubCategoryErp}!`;
                     resultFunction.data= null;
                     return resultFunction;
               }
            }else{
                     resultFunction.success = true;
                     resultFunction.message=`[V]  subcategoria ${skuSubCategoryErp} não foi encontrada!`;
                     resultFunction.data= null;
                     return resultFunction;
            }
          
        } catch (error) {
            console.log(error);
            throw error;

        }

    }
}