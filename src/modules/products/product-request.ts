import { type AxiosInstance, isAxiosError } from "axios";
import { type typePayloadProduct , type typePayloadVariants} from "./mapping-product-to-post.ts";
import { RetryExecution } from "../../shared/utils/retry-request.ts";

export class ProductRequest{
   
    private api:AxiosInstance;

    constructor( api:AxiosInstance  ){
          this.api = api;
        }

      async post<T> ( payload: Partial<typePayloadProduct> ):Promise<T> {
            try {
                    const response = await RetryExecution.executeWithRetry( ()=>  this.api.post<T>("/products", payload) );
                    return response.data;
            } catch (error) {
                if( isAxiosError(error)){
                        const errorData = error.response?.data;
                        const status = error.response?.status;
                        console.error(`Erro a tentar criar produto na Api da Nuvemshop [ Status: ${status}]: `, errorData);
                        throw new Error(errorData?.message || 'Erro desconhecido da API da nuvenshop');
                   } 
                   console.error(`Erro inesperado`, error);
                   throw error;
            }
    }

    
      async put<T> ( payload: Partial<Omit<typePayloadProduct, 'variants'>>, nuvemShopProductId:number ):Promise<T> {
            try {
                    const response = await RetryExecution.executeWithRetry( ()=>  this.api.put<T>(`/products/${nuvemShopProductId} `, payload) );
                    return response.data;
            } catch (error) {
                if( isAxiosError(error)){
                        const errorData = error.response?.data;
                        const status = error.response?.status;
                        console.error(`Erro a tentar Atualizar produto na Api da Nuvemshop [ Status: ${status}]: `, errorData);
                        throw new Error(errorData?.message || 'Erro desconhecido da API da nuvenshop');
                   } 
                   console.error(`Erro inesperado`, error);
                   throw error;
            }
      }


      async putVariant<T> ( payload: Partial<typePayloadVariants>, nuvemShopProductId:number, nuvemShopVariantId:number ):Promise<T> {
            try {
                    const response = await RetryExecution.executeWithRetry( ()=>  this.api.put<T>(`/products/${nuvemShopProductId}/variants/${nuvemShopVariantId}`, payload) );
                    return response.data;
            } catch (error) {
                if( isAxiosError(error)){
                        const errorData = error.response?.data;
                        const status = error.response?.status;
                        console.error(`Erro a tentar atualizar variante do produto na Api da Nuvemshop [ Status: ${status}]: `, errorData);
                        throw new Error(errorData?.message || 'Erro desconhecido da API da nuvenshop');
                   } 
                   console.error(`Erro inesperado`, error);
                   throw error;
            }
    }

}