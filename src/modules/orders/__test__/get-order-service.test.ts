
import describe, { test } from 'node:test';

import assert from 'node:assert';
import { GetOrdersRequest } from '../get-order-request.ts';
import { GetPedidosService } from '../services/get-orders-service.ts';

    test.it( " (test) getOrders",async ()=>{
        const getPedidoService = new GetPedidosService();

            try{
                  await getPedidoService.getPedidos('2026-06-30 17:50:00')
            } catch(e){
                console.log(e)
            }
      
    })