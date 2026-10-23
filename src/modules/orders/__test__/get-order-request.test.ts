
import { test } from 'node:test';
import { OrderRequest } from '../order-request.ts';
import { NuvemshopApi } from '../../../shared/api/api.ts';

test(" (test) getOrders", async () => {

        const API_TOKEN: string = process.env.API_TOKEN!
        const API_BASE_URL: string = process.env.API_BASE_URL!
        const API_VERSION: string = process.env.API_VERSION!
        const ID_LOJA: string = process.env.ID_LOJA!
        const APPLICATION_URL: string = process.env.APPLICATION_URL!
        const nuvemshopApi = new NuvemshopApi(API_BASE_URL, API_VERSION, ID_LOJA, API_TOKEN, APPLICATION_URL);

    try {
        const orderRequest = new OrderRequest(nuvemshopApi.api);

        const response = await orderRequest.getOrders({ status: 'any'}) as any[];
        
        for(const p of response){
            if(p.number == 103 ){
                //console.log(p.fulfillments[0])
                console.log(p)
            }

          }

    } catch (e) {
        console.log(e)
    }


})

