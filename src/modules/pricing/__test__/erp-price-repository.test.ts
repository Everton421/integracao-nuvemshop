import { describe, test } from 'node:test'
import  assert    from 'node:assert'
import { ErpPriceRepository } from '../repository/erp-price-repository.ts';
 

    const erpPriceRepository = new ErpPriceRepository();

 describe("Test SQL ERP ", async ()=>{
 

 await test.it("SQL erpPriceRepository.findPriceErpProductUpdateAt ", async ()=>{

    try{

    const resultfindPriceErpProductUpdateAt = await erpPriceRepository.findPriceErpProductUpdateAt(40242,'2026-05-01', 3); 
      console.log( resultfindPriceErpProductUpdateAt);
        assert.strictEqual( typeof resultfindPriceErpProductUpdateAt, 'object')
    }catch(e){
        console.log(e)
    }
})
 

 })
