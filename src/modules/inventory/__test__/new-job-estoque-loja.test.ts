import test from 'node:test';
import { JobEstoqueLoja } from '../job/job-estoque-loja.ts';
import { SyncEstoqueScService } from '../service/sync-estoque-sc-service.ts';
import { SyncEstoqueLojaService } from '../service/sync-estoque-loja-service.ts';

test("newJob estoque loja ", async (t)=>{

        await t.test("  SyncEstoqueLojaService  postStockLoja", async ()=>{
           await  SyncEstoqueLojaService.postStockLoja(72)
        })
})