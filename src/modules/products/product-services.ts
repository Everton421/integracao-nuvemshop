import { DateService } from "../../shared/utils/date-service.ts";
import { CategoriaIntegrationRepository } from "../categories/repository/categoria-integration-repository.ts";
import { CategoryServices } from "../categories/category-services.ts";
import { PhotosService } from "../photos/photos-service.ts";
import { MappingProductToPost, type typePayloadVariants } from "./mapping-product-to-post.ts";
import { ProductIntegration } from "./repository/produto-integration-repository.ts";
import { ProductErpRepository } from "./repository/produto-repository.ts";
import { type NuvemshopProductResponse, type ProductResponseVariant } from "./types/types-product-request.ts";
import { ProductRequest } from "./product-request.ts";
import { isAxiosError } from "axios";

type typeResponseFunction = {
    sucess: false, message: string, data: any
}

export class ProductServices {
    private productErpRepository: ProductErpRepository;
    private categoriaIntegrationRepository: CategoriaIntegrationRepository;
    private mappingProductToPost: MappingProductToPost;
    private productRequest: ProductRequest;
    private productIntegration: ProductIntegration;
    private categoryServices: CategoryServices;
    private photosServices: PhotosService;
    private dateService: DateService
    constructor(
        productErpRepository: ProductErpRepository,
        categoriaIntegrationRepository: CategoriaIntegrationRepository,
        mappingProductToPost: MappingProductToPost,
        productRequest: ProductRequest,
        productIntegration: ProductIntegration,
        categoryServices: CategoryServices,
        photosServices: PhotosService,
        dateService: DateService

    ) {
        this.productErpRepository = productErpRepository;
        this.categoriaIntegrationRepository = categoriaIntegrationRepository;
        this.mappingProductToPost = mappingProductToPost;
        this.productRequest = productRequest;
        this.productIntegration = productIntegration;
        this.categoryServices = categoryServices;
        this.photosServices = photosServices
        this.dateService = dateService;

    }

 

    async createProductByErpCode(productErp: number, priceTable: number,) :Promise<{success: boolean, message:string, data: any}>{
        try {
            const dataProductErpToSend = await this.productErpRepository.findSingleCompleteErpProduct(productErp, 'S', priceTable);
            const stockProduct = await this.productErpRepository.findStock(productErp);
            const stock = stockProduct.length ? stockProduct[0].ESTOQUE : 0;
  
                if (dataProductErpToSend.length) {
                    const p = dataProductErpToSend[0];

                        const codeCategoriesToSend: number[] = await this.categoryServices.resolveCategories(p.CODIGO_CATEGORIA, p.CODIGO_SUBCATEGORIA);

                        const payload = this.mappingProductToPost.mappingProduct(p,
                            codeCategoriesToSend,
                            stock
                        );

                        const response = await this.productRequest.post<NuvemshopProductResponse>(payload);

                        if (response) {
                            await this.productIntegration.inserir({
                                codigo_erp: p.CODIGO,
                                nome: payload.name?.pt || "",
                                dados_produto: JSON.stringify(response),
                                preco: payload.variants![0].price,
                                estoque: payload.variants![0].stock,
                                id_produto_nuvemshop: String(response.id),
                                dados_variante: JSON.stringify(response.variants),
                                ultimo_envio_produto: this.dateService.obterDataHoraAtual(),
                                id_variante_nuvemshop: String(response.variants[0].id),
                                ultimo_envio_estoque: this.dateService.obterDataHoraAtual(),
                                ultimo_envio_preco: this.dateService.obterDataHoraAtual()
                            })

                               await this.photosServices.syncPhotosProduct(productErp, response.id)
                               return { success: true, message:`Produto Código: ${productErp} enviado com sucesso.` , data: null }
                           }else{
                              return { success: false, message:`Ocorreu um erro ao tentar registrar o produto Código: ${productErp}`, data: null }
                           }
                }else{
                    return { success: false, message:`Produto Código: ${productErp} não foi encontrado.`, data: null }
                }

        } catch (error: any) {
            const message = isAxiosError(error) ? error.response?.data : error;
            console.error(`[X] ERRO CRÍTICO AO TENTAR ENVIAR PRODUTO ${productErp}, ERRO: `, message || error?.message)
            return { success: false, message:`Produto Código: ${productErp} não foi encontrado.`, data: message }
        }
    }

    async updateProductByErpCode(productErp: number, nuvemShopProductId: number, nuvemShopVariantId: number, priceTable: number, updatePhotos: boolean = true) {
        try {
            const dataProductErpToSend = await this.productErpRepository.findSingleCompleteErpProduct(productErp, 'S', priceTable);
            const stockProduct = await this.productErpRepository.findStock(productErp);
            const stock = stockProduct.length ? stockProduct[0].ESTOQUE : 0;

            if (dataProductErpToSend.length) {
                  const p = dataProductErpToSend[0];
                    // resolve as categorias
                    const codeCategoriesToSend: number[] = await this.categoryServices.resolveCategories(p.CODIGO_CATEGORIA, p.CODIGO_SUBCATEGORIA);

                    const payload = this.mappingProductToPost.mappingProduct(
                        p,
                        codeCategoriesToSend,
                        stock
                    );

                    //payload da variant
                    const payloadVariant = payload.variants;
                    
                    // exclui as variants para envio do endpoint de produtos
                    delete payload.variants;
                    delete payload.images;

                    const response = await this.productRequest.put<NuvemshopProductResponse>(payload, nuvemShopProductId);

                    if (response) {
                        await this.updateVariantByPayload(productErp, payloadVariant![0], nuvemShopProductId, nuvemShopVariantId)

                        await this.productIntegration.update({
                            codigo_erp: p.CODIGO,
                            nome: payload.name?.pt || "",
                            dados_produto: JSON.stringify(response),
                            ultimo_envio_produto: this.dateService.obterDataHoraAtual(),
                        },  p.CODIGO)

                        updatePhotos && await this.photosServices.syncPhotosProduct(productErp, nuvemShopProductId);
                         return { success: true, message:`Produto Código: ${productErp} atualizado com sucesso.` , data: null }
                      }else{
                       return { success: false, message:`Produto Código: ${productErp} não foi encontrado.`, data: null }
                      }
            } else {
                    return { success: false, message:`Produto Codigo: ${productErp} Id NunvemShop: ${nuvemShopProductId} não foi encontrado.`, data: null }
            }
        } catch (error: any) {
            const message = isAxiosError(error) ? error.response?.data : error;
            console.error(`[X] ERRO CRÍTICO AO TENTAR ATUALIZAR PRODUTO ${productErp}, ERRO: `, error?.message || error);
             return { success: false, message:`Produto Código: ${productErp} não foi encontrado.`, data: message }

        }
    }

    private async updateVariantByPayload(productErp: number, payloadVariants: typePayloadVariants, nuvemShopProductId: number, nuvemShopVariantId: number) {
        try {
            const response = await this.productRequest.putVariant<ProductResponseVariant>(payloadVariants, nuvemShopProductId, nuvemShopVariantId)

            if (response) {
                await this.productIntegration.update({
                    dados_variante: JSON.stringify(response),
                },   productErp)
                        return { success: true, message:`Variante do Produto Código: ${productErp} atualizada com sucesso.` , data: null }
            }else{
                 return { success: false, message:`Ocorreu um erro ao tentar atualizar a variante do produto Código: ${productErp}`, data: null }
            }

        } catch (error: any) {
            const message = isAxiosError(error) ? error.response?.data : error;
            console.error(`[X] ERRO CRÍTICO AO TENTAR ATUALIZAR VARIANTE DO PRODUTO ${productErp}, ERRO: `, error?.message || error)
            return { success: false, message:`Produto Código: ${productErp} não foi encontrado.`, data: message }
        }
    }

    async updateVariantByErpCode(productErp: number, nuvemShopProductId: number, nuvemShopVariantId: number, priceTable: number,) {
        try {
            const dataProductErpToSend = await this.productErpRepository.findSingleCompleteErpProduct(productErp, 'S', priceTable);

            if (dataProductErpToSend.length) {
                const p =dataProductErpToSend[0];
                    const payload = this.mappingProductToPost.mappingVariant(p);
                    const response = await this.productRequest.putVariant<ProductResponseVariant>(payload, nuvemShopProductId, nuvemShopVariantId)

                    if (response) {
                        await this.productIntegration.update({
                            codigo_erp: p.CODIGO,
                            dados_variante: JSON.stringify(response),
                        }, productErp)
                           
                        return { success: true, message:`Variante do Produto Código: ${productErp} atualizada com sucesso.` , data: null }
                    }else{
                          return { success: false, message:`Ocorreu um erro ao tentar atualizar a variante do produto Código: ${productErp}`, data: null }
                    }
            }else{
                    return { success: false, message:`Produto Código: ${productErp} não foi encontrado.`, data: null }
            }

        } catch (error: any) {
                  const message = isAxiosError(error) ? error.response?.data : error;
            console.error(`[X] ERRO CRÍTICO AO TENTAR ATUALIZAR VARIANTE DO PRODUTO ${productErp}, ERRO: `, error?.message || error)
            return { success: false, message:`Produto Código: ${productErp} não foi encontrado.`, data: message }
      
        }
    }



}

