
import test, { describe } from 'node:test'
import { ErpInventoryRepository } from '../repository/erp-inventory-repository.ts'

describe("Teste",async () =>{
    test.it("buscaSaldoRealProdutosLoja", async()=>{
        const erpInventoryRepository = new ErpInventoryRepository();

      const data=  await erpInventoryRepository.buscaSaldoRealProdutosLoja(36082)
        console.log(data);
    })
       test.it("buscaSaldoRealProdutosSymaSc", async()=>{
        const erpInventoryRepository = new ErpInventoryRepository();

      const data=  await erpInventoryRepository.buscaSaldoRealProdutosSymaSc(36082)
        console.log(data);
    })
})