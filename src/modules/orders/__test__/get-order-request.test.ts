
import describe, { test } from 'node:test';

import assert from 'node:assert';
import { GetOrdersRequest } from '../get-order-request.ts';

    test.it( " (test) getOrders",async ()=>{

        try{

        const orders = await GetOrdersRequest.getOrders({
             lastDateStr:'2026-09-24',
             status: 'any',
        });
         
 
        for(const order of orders){
            if(order.name == '#1494'){
                    console.log({ transactions: order.transactions[0]  }  )
                   //console.log({ billingAddress: order.billingAddress  }  )
                   //console.log({ paymentTerms: order.paymentTerms  }  )

                  //console.log(   JSON.stringify(order) )
                  
            }
        }

             

    }catch(e){
            console.log(e)
        }



    })

    