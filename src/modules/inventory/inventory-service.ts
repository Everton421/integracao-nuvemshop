import { DateService } from '../../shared/utils/date-service.ts';
import { ProductIntegration } from '../products/repository/produto-integration-repository.ts';
import { MappingInventory, type typePayloadInventory } from './inventory-mapping.ts'
import { InventoryRequest } from './inventory-request.ts'
 

/**
 * Serviço de envio de estoque ou preço
 */
export class InventoryService{
        private productIntegration:ProductIntegration;
        private inventoryRequest:InventoryRequest;
        private mappingInventory:MappingInventory;
        private dateService: DateService;

         constructor(
            productIntegration:ProductIntegration,
            inventoryRequest:InventoryRequest,
            mappingInventory:MappingInventory,
            dateService: DateService
        
        ){
            this.productIntegration =productIntegration;
            this.inventoryRequest =inventoryRequest;
            this.mappingInventory=mappingInventory;
            this.dateService= dateService;
      }

      /**
       * 
       * @param code Codigo do produto no ERP
       * @param stock Estoque do produto
       * @param price Preço do produto
       */
    async updateInventory( input:{ code: number,stock?:number, price?:number, promotion?:number} ){
        const {code, price, stock, promotion } =input;
        try{

                const data = await  this.productIntegration.findByCodigoErp(code);
                const {   id_produto_nuvemshop, id_variante_nuvemshop  } =data[0];

                const dataInventory = this.mappingInventory.mapp(
                         { productNuvemshopId: Number(id_produto_nuvemshop),
                            variantNuvemshopId:  Number(id_variante_nuvemshop),
                            stock:stock , 
                            price: price,
                            promotion:promotion
                        } );

                const result = await this.inventoryRequest.patch<typePayloadInventory[]>([dataInventory])

                if( result.length   ){
                    let payloadUpdateLocal: { estoque?:number, preco?:number, promocao ?:number, ultimo_envio_estoque?:string , ultimo_envio_preco?:string  } = { }
                        if(stock){
                             payloadUpdateLocal.estoque = stock;
                            payloadUpdateLocal.ultimo_envio_estoque = this.dateService.obterDataHoraAtual()
                        }
                        if(price){
                            payloadUpdateLocal.preco = price;
                            payloadUpdateLocal.ultimo_envio_preco = this.dateService.obterDataHoraAtual()
                        } 
                        if(promotion){
                            payloadUpdateLocal.promocao = promotion;
                        }
                    await  this.productIntegration.update( payloadUpdateLocal , code);
                }
            }catch(error: any){
                console.error(`[X] ERRO CRÍTICO AO TENTAR ENVIAR ESTOQUE/PREÇO ${code}, ERRO: `, error?.message || error)
            }
    } 
}