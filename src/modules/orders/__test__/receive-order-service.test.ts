
import { test } from 'node:test';
import { ReceiveOrderServiceFactory } from '../services/receive-order-service-factory.ts';

test(" (test) getOrders", async () => {

    try {

        const syncOrderErpService = ReceiveOrderServiceFactory.createReceiveService();

        await syncOrderErpService.syncOrder({ status: 'any' }, 1, 1);

    } catch (e) {
        console.log(e)
    }


})

