import { DateService } from "../../shared/utils/date-service.ts";
import { CategoriaIntegrationRepository } from "../categories/repository/categoria-integration-repository.ts";
import { CategoryServices } from "../categories/category-services.ts";
import { PhotosService } from "../photos/photos-service.ts";
import { MappingProductToPost, type typePayloadVariants } from "./mapping-product-to-post.ts";
import { ProductIntegration } from "./repository/produto-integration-repository.ts";
import { ProductErpRepository   } from "./repository/produto-repository.ts";
import { type NuvemshopProductResponse, type ProductResponseVariant } from "./types/types-product-request.ts";
import { ProductRequest } from "./product-request.ts";

type typeResponseFunction = {
    sucess:false, message:string, data:any 
}

  export class ProductServices{
          private productErpRepository:ProductErpRepository;
          private categoriaIntegrationRepository:CategoriaIntegrationRepository;
          private mappingProductToPost:MappingProductToPost;
          private productRequest: ProductRequest;
          private productIntegration: ProductIntegration;
          private categoryServices: CategoryServices;
          private photosServices: PhotosService;
        private dateService :DateService
    constructor(
         productErpRepository:ProductErpRepository,
         categoriaIntegrationRepository:CategoriaIntegrationRepository,
         mappingProductToPost:MappingProductToPost,
         productRequest: ProductRequest,
         productIntegration: ProductIntegration,
         categoryServices: CategoryServices,
         photosServices: PhotosService,
         dateService :DateService

    ){
        this.productErpRepository= productErpRepository;
        this.categoriaIntegrationRepository= categoriaIntegrationRepository;
        this.mappingProductToPost= mappingProductToPost;
        this.productRequest= productRequest;
        this.productIntegration= productIntegration;
        this.categoryServices= categoryServices;
         this.photosServices= photosServices
         this.dateService =dateService;

    }
    
    async createProductByErpCode (productErp:number, priceTable:number,){
        try{
        const dataProductErpToSend = await this.productErpRepository.findSingleCompleteErpProduct(productErp, 'S', priceTable);
                      const stockProduct = await this.productErpRepository.findStock(productErp);
                const stock =  stockProduct.length ? stockProduct[0].ESTOQUE : 0;
              
              if(dataProductErpToSend.length){

                    for( const p of dataProductErpToSend ){
                         const codeCategoriesToSend:number[]=[];

                       const dataCategories = await this.categoriaIntegrationRepository.findByErpCodigo('grupo', p.CODIGO_CATEGORIA)
                       const dataSubCategories = await this.categoriaIntegrationRepository.findByErpCodigo('subgrupo', p.CODIGO_SUBCATEGORIA)

                        if( dataCategories.length > 0 ){
                           codeCategoriesToSend.push(Number(dataCategories[0].id_nuvemshop));
                        }else{
                            // tenta enviar e obter o codigo da categoria.
                            console.log(`[!] categoria ${p.CODIGO_CATEGORIA} não foi enviada, verificando possibilidade de envio.`)
                              const responseSyncCategory = await this.categoryServices.syncCategory(p.CODIGO_CATEGORIA);
                                if( responseSyncCategory.success){
                                    const dataCategories = await this.categoriaIntegrationRepository.findByErpCodigo('grupo', p.CODIGO_CATEGORIA)
                                        dataCategories.length &&  codeCategoriesToSend.push(Number(dataCategories[0].id_nuvemshop));
                                }
                        }

                        if( dataSubCategories.length > 0 ){
                                codeCategoriesToSend.push(Number(dataSubCategories[0].id_nuvemshop));
                         }else{
                            // enviar e obter o codigo da subcategoria.
                            console.log(`[!] subCategoria ${p.CODIGO_SUBCATEGORIA} não foi enviada, verificando possibilidade de envio.`)
                              const responseSyncSubCategory = await this.categoryServices.syncSubCategory(p.CODIGO_SUBCATEGORIA);
                              if( responseSyncSubCategory.success){
                                    const dataSubCategories = await this.categoriaIntegrationRepository.findByErpCodigo('subgrupo', p.CODIGO_SUBCATEGORIA)
                                    dataSubCategories.length &&  codeCategoriesToSend.push(Number(dataSubCategories[0].id_nuvemshop));
                              }
                         }
                     
                    const payload = this.mappingProductToPost.mappingProduct(p, 
                        codeCategoriesToSend, 
                        stock
                    );


                    const response = await this.productRequest.post<NuvemshopProductResponse>(  payload )
                    if(response){
                        await this.productIntegration.inserir({
                            codigo_erp:  p.CODIGO,
                            nome: payload.name?.pt ||  "",
                            dados_produto: JSON.stringify(response),
                            preco: payload.variants![0].price,
                            estoque: payload.variants![0].stock,
                            id_produto_nuvemshop: String(response.id),
                            dados_variante: JSON.stringify(response.variants), 
                            ultimo_envio_produto: this.dateService.obterDataHoraAtual(),
                            id_variante_nuvemshop: String(response.variants[0].id),
                            ultimo_envio_estoque:this.dateService.obterDataHoraAtual(),
                            ultimo_envio_preco: this.dateService.obterDataHoraAtual()
                        })
                     
                         await this.photosServices.syncPhotosProduct(productErp, response.id)

                       }
                    }
              }

              

                  } catch (error:any) {
            console.error(`[X] ERRO CRÍTICO AO TENTAR ENVIAR PRODUTO ${productErp}, ERRO: `, error?.message || error)
         }
       }
    async updateProductByErpCode (productErp:number, nuvemShopProductId: number,nuvemShopVariantId: number, priceTable:number, updatePhotos:boolean = true ){
        try {
               const dataProductErpToSend = await this.productErpRepository.findSingleCompleteErpProduct(productErp, 'S', priceTable);
                const stockProduct = await this.productErpRepository.findStock(productErp);
                const stock =  stockProduct.length ? stockProduct[0].ESTOQUE : 0;
              

                let responseFunction:typeResponseFunction = { sucess:false, message:'', data: null };

            if(dataProductErpToSend.length){

                        for( const p of dataProductErpToSend ){
                            const codeCategoriesToSend:number[]=[];

                            const dataCategories  =   await this.categoriaIntegrationRepository.findByErpCodigo('grupo', p.CODIGO_CATEGORIA)
                            const dataSubCategories = await this.categoriaIntegrationRepository.findByErpCodigo('subgrupo', p.CODIGO_SUBCATEGORIA)

                            if( dataCategories.length > 0 ){
                                codeCategoriesToSend.push(Number(dataCategories[0].id_nuvemshop));
                            }else{
                                // tenta enviar e obter o codigo da categoria.
                                console.log(`[!] categoria ${p.CODIGO_CATEGORIA} não foi enviada, verificando possibilidade de envio.`)
                                const responseSyncCategory = await this.categoryServices.syncCategory(p.CODIGO_CATEGORIA);
                                    if( responseSyncCategory.success){
                                        const dataCategories = await this.categoriaIntegrationRepository.findByErpCodigo('grupo', p.CODIGO_CATEGORIA)
                                        dataCategories.length &&  codeCategoriesToSend.push(Number(dataCategories[0].id_nuvemshop));
                                    }
                            }

                            if( dataSubCategories.length > 0 ){
                                    codeCategoriesToSend.push(Number(dataSubCategories[0].id_nuvemshop));
                            }else{
                                // enviar e obter o codigo da subcategoria.
                                console.log(`[!] subCategoria ${p.CODIGO_SUBCATEGORIA} não foi enviada, verificando possibilidade de envio.`)
                                const responseSyncSubCategory = await this.categoryServices.syncSubCategory(p.CODIGO_SUBCATEGORIA);
                                if( responseSyncSubCategory.success){
                                        const dataSubCategories = await this.categoriaIntegrationRepository.findByErpCodigo('subgrupo', p.CODIGO_SUBCATEGORIA)
                                        dataSubCategories.length &&  codeCategoriesToSend.push(Number(dataSubCategories[0].id_nuvemshop));
                                }
                            }
                        
                        const payload = this.mappingProductToPost.mappingProduct(
                            p, 
                            codeCategoriesToSend,
                             stock 
                        );

                            const payloadVariant  = payload.variants;
                            delete payload.variants;
                            delete payload.images;
                        
                                console.log(payloadVariant);
                        const response = await this.productRequest.put<NuvemshopProductResponse>(  payload, nuvemShopProductId );
 
                        if(response){
                                if(payload.variants)  await this.updateVariantByPayload( productErp,payloadVariant![0] , nuvemShopProductId,nuvemShopVariantId  )

                            await this.productIntegration.update({
                                        codigo_erp:p.CODIGO,
                                        nome: payload.name?.pt ||  "",
                                        dados_produto: JSON.stringify(response),
                                        ultimo_envio_produto: this.dateService.obterDataHoraAtual(),
                                        },
                                        p.CODIGO )
                                        
                                    updatePhotos && await this.photosServices.syncPhotosProduct(productErp, nuvemShopProductId);

                            } 
                        }
            }else{
                responseFunction.data = nuvemShopProductId;
                responseFunction.message=`Produto Codigo: ${productErp} Id NunvemShop: ${nuvemShopProductId} não foi encontrado.`
                responseFunction.sucess = false; 
            }
          } catch (error:any) {
            console.error(`[X] ERRO CRÍTICO AO TENTAR ATUALIZAR PRODUTO ${productErp}, ERRO: `, error?.message || error)
         } 
    } 

        async updateVariantByPayload( productErp: number ,payloadVariants: typePayloadVariants, nuvemShopProductId: number, nuvemShopVariantId:number ){
        try{    
                    const response = await this.productRequest.putVariant<ProductResponseVariant>(  payloadVariants, nuvemShopProductId, nuvemShopVariantId )
                        
                       if(response){
                               await this.productIntegration.update({
                                dados_variante: JSON.stringify(response),
                               },
                                   productErp
                              )


                        }
                    
          } catch (error:any) {
             console.error(`[X] ERRO CRÍTICO AO TENTAR ATUALIZAR VARIANTE DO PRODUTO ${productErp}, ERRO: `, error?.message || error)
         }
    }

    async updateVariantByErpCode( productErp: number , nuvemShopProductId: number, nuvemShopVariantId:number,  priceTable:number,){
        try{
          const dataProductErpToSend = await this.productErpRepository.findSingleCompleteErpProduct(productErp, 'S', priceTable);

              if(dataProductErpToSend.length){

                    for( const p of dataProductErpToSend ){
                     
                      const payload = this.mappingProductToPost.mappingVariant( p );


                    const response = await this.productRequest.putVariant<ProductResponseVariant>(  payload, nuvemShopProductId, nuvemShopVariantId )
                        
                       if(response){
                               await this.productIntegration.update({
                                codigo_erp: p.CODIGO,
                                dados_variante: JSON.stringify(response),
                               },
                            productErp
                            )
                        }
                    }
               }

          } catch (error:any) {
             console.error(`[X] ERRO CRÍTICO AO TENTAR ATUALIZAR VARIANTE DO PRODUTO ${productErp}, ERRO: `, error?.message || error)
         }
    }   


    
  } 

