
import test from 'node:test';
import { UpdateStatusFaturamentoService } from '../services/update-status-faturamento.ts';
import { JobSendInvoice } from '../job/job-send-invoice.ts';
 
 
test( " (test) job send invoice",async ()=>{
    await JobSendInvoice.job()
    });