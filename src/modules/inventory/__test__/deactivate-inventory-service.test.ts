



import test from 'node:test'
import { DeactivateInventoryService } from '../service/deactivate-inventory-service.ts'

test.it("", async ()=>{
    await DeactivateInventoryService.exec( "gid://shopify/ProductVariant/56558289092774" ,"gid://shopify/Location/80446783654")
})