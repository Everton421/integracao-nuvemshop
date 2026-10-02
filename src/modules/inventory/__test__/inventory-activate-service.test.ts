import test from 'node:test';
import { InventoryActivate } from '../service/inventory-activate-service.ts';
import { UpdateEstoqueService } from '../service/update-estoque-service.ts';




test.it("", async ()=>{

       const updateEstoqueService = new UpdateEstoqueService();
        //const response = await updateEstoqueService.post({
        //             erp_sku:17143,
        //             estoque: 0,
        //             id_local:"2",
        //             id_local_shopify:"gid://shopify/Location/80446783654",
        //             inventoryItemId:"gid://shopify/InventoryItem/55019899977894",
        //             ultimo_envio_estoque:"2026-06-01 15:05:47",
        //             variante_id:"gid://shopify/ProductVariant/56558289092774",
        //         })
        //         console.log(response);


             
           const resultActivate =   await InventoryActivate.activate({ 
                     available : 1,
                     inventoryItemId:"gid://shopify/InventoryItem/55023550955686", 
                     locationId:"gid://shopify/Location/80446783654", 
                     onHand: null,
                     erp_sku: 55913
                 })
})