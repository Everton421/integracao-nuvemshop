import test from 'node:test';
import { JobEstoqueSc } from '../job/job-estoque-sc.ts';
import { SyncEstoqueScService } from '../service/sync-estoque-sc-service.ts';

test("newJob estoque sc ", async (t)=>{

        await t.test("newJob estoque sc ", async ()=>{
            await SyncEstoqueScService.postStockSC(72)
        })
})