import { type AxiosInstance, isAxiosError } from "axios";
import { RetryExecution } from "../../shared/utils/retry-request.ts";
import { type GetOrdersInput } from "./types/type-input-order-request.ts";
import {type NuvemshopOrderStatus } from "./types/types-order-request.ts";

 export class OrderRequest {

      private api:AxiosInstance;
  
      constructor( api:AxiosInstance  ){
            this.api = api;
          }
  
    async getOrders<T>(input: GetOrdersInput):Promise<T>{
        try {
                          const response = await RetryExecution.executeWithRetry( ()=>  this.api.get<T>(`/orders`,{
                            params: input
                          } ) );
                          return response.data;
                  } catch (error) {
                      if( isAxiosError(error)){
                              const errorData = error.response?.data;
                              const status = error.response?.status;
                              console.error(`Erro a tentar consultar pedidos na Api da Nuvemshop [ Status: ${status}]: `, errorData);
                              throw new Error(errorData?.message || 'Erro desconhecido da API da nuvenshop');
                        } 
                        console.error(`Erro inesperado`, error);
                        throw error;
                  }
    }


    async putOrder<T>(status: NuvemshopOrderStatus, orderId:Number){
           try {
                          const response = await RetryExecution.executeWithRetry( ()=>  this.api.put<T>(`/orders/${orderId}`,{
                            status
                          } ) );
                          return response.data;
                  } catch (error) {
                      if( isAxiosError(error)){
                              const errorData = error.response?.data;
                              const status = error.response?.status;
                              console.error(`Erro a tentar alterar staus do pedido na Api da Nuvemshop [ Status: ${status}]: `, errorData);
                              throw new Error(errorData?.message || 'Erro desconhecido da API da nuvenshop');
                        } 
                        console.error(`Erro inesperado`, error);
                        throw error;
                  }
    }

 }