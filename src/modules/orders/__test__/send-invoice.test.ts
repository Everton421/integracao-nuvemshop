
import test from 'node:test';
import { UpdateStatusFaturamentoService } from '../services/update-status-faturamento.ts';
import { SendInvoiceService } from '../services/send-invoice-service.ts';
 
 
test( " (test) pedidosFaturados",async ()=>{
       await SendInvoiceService.sendInvoice(
        'gid://shopify/Order/12831208734886',
        '1122725',
        '41260604912543000136550010011227251829781008'
       )
    });