import { type typeCompleteProduct } from "./repository/produto-repository.ts";

   export type typePayloadProduct = {
      name: {
                pt :string
            },
         description :{
                 pt : string  
            },
            has_stock: boolean,
            visibility?: 'hidden' | 'unlisted' | 'visible',
        brand:string,
        tags:string
        variants: typePayloadVariants[]
        categories: number[] ,
        images? : typeImagesPayload[],  
    }

   export   type typePayloadVariants = {
        stock_management?: boolean,
        stock?: number, // ESTOQUE
        weight?: string, // Peso da Product Variant em quilogramas
        cost?:  string,// CUSTO
        promotional_price?: string, // preço promicional
        depth?:  number, // Profundidade da Product Variant em centímetros
        height?: number, // Altura da Product Variant em centímetros
        price?: string, //PRECO
        sku?: number, // Identificador único da Product Variant na sua loja
        width?: number, // LARGURA
        barcode?:string, // O valor associado a um identificador do produto (GTIN, EAN, ISBN, etc.)
        visible?: boolean, // true se a variante está visível na loja. false caso contrário
   }

   type typeImagesPayload={ 
      src:string
      position: number
  }


 export class MappingProductToPost{
         mappingProduct(dataProductErp :typeCompleteProduct ,categories:number[], stock?:number ){

            let partialPayload:Partial<typePayloadProduct> ={
                visibility: 'visible',
                 has_stock: true

            };  

            if(dataProductErp.TITULO_SITE) partialPayload.name = { pt : dataProductErp.TITULO_SITE }

            if(dataProductErp.DESCR_LONGA_SITE){
                partialPayload.description =  {
                        pt: dataProductErp.DESCR_LONGA_SITE
                    }
            }

            const tags = []
            if(dataProductErp.CATEGORIA ) tags.push(dataProductErp.CATEGORIA)
            if(dataProductErp.SUBCATEGORIA ) tags.push(dataProductErp.SUBCATEGORIA)
            if(dataProductErp.MARCA ) tags.push(dataProductErp.MARCA)
            if(tags.length)  partialPayload.tags = tags.toString();   
            if(dataProductErp.MARCA ) partialPayload.brand = dataProductErp.MARCA;   
            const payloadVariant =  this.mappingVariant(dataProductErp, stock); 
            partialPayload.variants = [payloadVariant]

            // Adiciona as categorias no objeto 
            if(categories && categories.length > 0 ){
                partialPayload.categories = categories;
            } 
            if(dataProductErp.NO_SITE == 'N'){
                partialPayload.visibility = 'hidden';
            }
           
               return partialPayload;
    }

       mappingVariant(dataProductErp :typeCompleteProduct ,stock?:number   ){

            let payloadVariant: typePayloadVariants ={};
            if(dataProductErp.NUM_FABRICANTE && dataProductErp.NUM_FABRICANTE != '' ) payloadVariant.barcode  = dataProductErp.NUM_FABRICANTE  ;
            if(dataProductErp.ULT_CUSTO)  payloadVariant.cost = String(dataProductErp.ULT_CUSTO);
            if(dataProductErp.COMPRIMENTO)  payloadVariant.depth =dataProductErp.COMPRIMENTO;
            if(dataProductErp.ALTURA)  payloadVariant.height =dataProductErp.ALTURA; 
            if(dataProductErp.PRECO != null  )  payloadVariant.price =dataProductErp.PRECO; 
            if(dataProductErp.PROMOCAO  )  payloadVariant.promotional_price = dataProductErp.PROMOCAO
            if(dataProductErp.CODIGO)  payloadVariant.sku = dataProductErp.CODIGO; 
            if(stock != null  || stock != undefined )    payloadVariant.stock = stock;
            if(dataProductErp.PESO)  payloadVariant.weight = String(dataProductErp.PESO);  
            if(dataProductErp.LARGURA)  payloadVariant.width = dataProductErp.LARGURA;  
          
               return payloadVariant;
    }

  }
