import test from 'node:test';
import assert from 'node:assert';
import { OrderMapper } from '../order-mapper.ts';
import { DateService } from '../../../shared/utils/date-service.ts';

 

test("(test) Obter status do pedido no sistema ", async ( t  )=>{

      const switchSituationErpOrder = new OrderMapper( new DateService());


    await t.test(" Pedido Pago parcialmente", ()=>{
              const statusERP = switchSituationErpOrder.switchSituation(  'partially_paid', 'open' )
              assert.strictEqual( statusERP, 'EA', `Erro, Pedido Pago parcialmente com retorno inesperado no teste. Valor retornado: ${statusERP} Valor Esperado: EA `)
    })


    await t.test(" Pedido Pago ", ()=>{
              const statusERP = switchSituationErpOrder.switchSituation(  'paid', 'open' )
          assert.strictEqual( statusERP, 'AI', `Erro, Pedido Pago com retorno inesperado no teste. Valor retornado: ${statusERP} Valor Esperado: AI `)
    })

   await t.test(" Pedido Cancelado ", ()=>{
              const statusERP = switchSituationErpOrder.switchSituation(  'paid', 'cancelled' )
          assert.strictEqual( statusERP, 'RE', `Erro, Pedido Cancelado com retorno inesperado no teste. Valor retornado: ${statusERP} Valor Esperado: RE `)
    })

  await t.test(" Pedido Fechado ", ()=>{
              const statusERP = switchSituationErpOrder.switchSituation(  'paid', 'closed' )
          assert.strictEqual( statusERP,  null , `Erro, Pedido Fechado com retorno inesperado no teste. Valor retornado: ${statusERP} Valor Esperado: NULL `)
    })

})
