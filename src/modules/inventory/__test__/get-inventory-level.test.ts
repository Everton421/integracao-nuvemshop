import test from 'node:test'
import { GetInventoryLevelRequest } from '../request/get-inventory-level-request.ts'

test.it("", async ()=>{

      const resultInventoryLevelLoja = await GetInventoryLevelRequest.getInventoryLevelVariant("gid://shopify/ProductVariant/56432632823974","gid://shopify/Location/80062283942")
      const resultInventoryLevelSC = await GetInventoryLevelRequest.getInventoryLevelVariant("gid://shopify/ProductVariant/56432632823974","gid://shopify/Location/80446783654")
        
            console.log("resultInventoryLevelLoja: ",resultInventoryLevelLoja.data?.productVariant.inventoryItem.inventoryLevel);
            console.log("resultInventoryLevelSC: ",resultInventoryLevelSC.data?.productVariant.inventoryItem.inventoryLevel);
})