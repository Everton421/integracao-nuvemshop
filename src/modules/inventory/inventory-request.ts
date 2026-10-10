import { type AxiosInstance, isAxiosError } from "axios";
import { type typePayloadInventory } from "./inventory-mapping.ts";
import { RetryExecution } from "../../shared/utils/retry-request.ts";

export class InventoryRequest {
       private api:AxiosInstance;
    
        constructor( api:AxiosInstance  ){
              this.api = api;
            }
            
        async patch<T>( payload:typePayloadInventory[] ):Promise<T>{
                try {
                                const response = await RetryExecution.executeWithRetry( ()=>  this.api.patch<T>(`/products/stock-price`, payload) );
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

}