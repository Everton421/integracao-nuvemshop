import test from 'node:test';
import { NuvemshopApi } from '../../../shared/api/api.ts';
import { OrderRequest } from '../order-request.ts';
import {type NuvemshopOrder } from '../types/types-order-request.ts';


test(`(test) Atualização de status do pedido `, async ()=>{
    
        const API_TOKEN: string = process.env.API_TOKEN!
         const API_BASE_URL: string = process.env.API_BASE_URL!
         const API_VERSION: string = process.env.API_VERSION!
         const ID_LOJA: string = process.env.ID_LOJA!
         const APPLICATION_URL: string = process.env.APPLICATION_URL!
         const nuvemshopApi = new NuvemshopApi(API_BASE_URL, API_VERSION, ID_LOJA, API_TOKEN, APPLICATION_URL);
   
     try {
         const orderRequest = new OrderRequest(nuvemshopApi.api);
        const orderId ='2094291823';
         const response = await orderRequest.putOrder<NuvemshopOrder>('closed', Number(orderId));
         
         console.log(response);
   
     } catch (e) {
         console.log(e)
     }
})