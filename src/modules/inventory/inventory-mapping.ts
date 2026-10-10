// mapping 
type typeInventoryLevel={
         stock : number
}
type typeVariantInventory={
        id : number,
        price? : number,
        promotional_price?:number
        inventory_levels? : typeInventoryLevel[]
}
/**
 * IMPORTANTE
 * inventory_levels é opcional, mas, quando enviado, cada elemento deve incluir stock
 */
export type typePayloadInventory = {
         id : number,
        variants: typeVariantInventory[ ]
}

export class MappingInventory{
     
      mapp(input:{productNuvemshopId:number, variantNuvemshopId:number, stock?:number, price?:number, promotion?:number}  ): typePayloadInventory{
        const { productNuvemshopId, variantNuvemshopId, price ,promotion, stock } = input;

        let variantPayload:typeVariantInventory ={
                    id:variantNuvemshopId,
        } 
        if(price != undefined || price != null ) variantPayload.price = price;
        if(promotion != null ||  promotion != undefined) variantPayload.promotional_price = promotion
        if(stock) variantPayload.inventory_levels = [{ stock : stock}];
        return { 
            id: productNuvemshopId,
             variants:[
               variantPayload
             ]
        }
    }  
}
