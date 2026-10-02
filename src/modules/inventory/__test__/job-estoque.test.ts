import test from 'node:test';
import { JobEstoqueLoja } from '../job/job-estoque-loja.ts';
import { JobEstoqueSc } from '../job/job-estoque-sc.ts';

test.it("", async ()=>{

 await JobEstoqueLoja.job(55913);
     await JobEstoqueSc.job(55913);

});
