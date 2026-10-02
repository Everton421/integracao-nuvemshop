import describe from 'node:test';
import test from 'node:test';
import { ErpInventoryRepository } from '../repository/erp-inventory-repository.ts';
import { VariantesLocaisIntegration } from '../../products/repository/variantes-locais-integration.ts';

describe("teste", async  ()=>{

    const erpInventoryRepository = new ErpInventoryRepository();
    test.it("", async ()=>{
       // try{
//
       // const resultSql1 = await erpInventoryRepository.buscaEstoqueRealLojaSyma( 52256 );
       // //console.log("SQL 1: ", resultSql1)
       // }catch(e){
       //     console.log(e)
       // }
//
//
       // try{
//
       // const resultSql2 = await erpInventoryRepository.buscaSaldoRealProdutosLoja( 52256 );
       // //console.log("SQL 2: ", resultSql2)
       // }catch(e){
       //     console.log(e)
       // }


        try{
        const variantesLocaisIntegration = new VariantesLocaisIntegration(); 
            const data = await variantesLocaisIntegration.getVariantLocalBySkuAndIdLocal(52256,2)
        console.log(data)

        }catch(e){
        console.log(e)
        }
 
        })

})
