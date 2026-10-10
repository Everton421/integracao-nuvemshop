import { isAxiosError, type AxiosInstance } from "axios";
import { type typePayloadPostPhoto } from "./types/types-photos-request.ts";
import { RetryExecution } from "../../shared/utils/retry-request.ts";



  export class PhotosRequest {
       private api:AxiosInstance;
    
        constructor( api:AxiosInstance  ){
              this.api = api;
            }
            
        async post<T>( payload:typePayloadPostPhoto , nuvemShopProductId:number):Promise<T>{
                try {
                            const response = await RetryExecution.executeWithRetry( ()=>  this.api.post<T>(`/products/${nuvemShopProductId}/images`, payload) );
                                return response.data;
                        } catch (error) {
                            if( isAxiosError(error)){
                                    const errorData = error.response?.data;
                                    const status = error.response?.status;
                                    console.error(`Erro a tentar enviar fotos do produto na Api da Nuvemshop [ Status: ${status}]: `, errorData);
                                    throw new Error(errorData?.message || 'Erro desconhecido da API da nuvenshop');
                                } 
                                console.error(`Erro inesperado`, error);
                                throw error;
                }
        }   

        async delete( nuvemShopProductId: number, nuvemShopPhotoId: number){
              try {
                            const response = await RetryExecution.executeWithRetry( ()=>  this.api.delete(`/products/${nuvemShopProductId}/images/${nuvemShopPhotoId}`) );
                                return response.status;
                        } catch (error) {
                            if( isAxiosError(error)){
                                    const errorData = error.response?.data;
                                    const status = error.response?.status;
                                    console.error(`Erro a tentar excluir foto do produto na Api da Nuvemshop [ Status: ${status}]: `, errorData);
                                    throw new Error(errorData?.message || 'Erro desconhecido da API da nuvenshop');
                                } 
                                console.error(`Erro inesperado`, error);
                                throw error;
                }  
        }
}
