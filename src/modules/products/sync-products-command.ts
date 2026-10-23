import { ProductServices } from "./product-services.ts";
import { ProductErpRepository } from "./repository/produto-repository.ts";


export class SyncProductsCommand{
    private productServices : ProductServices
    private productErpRepository:ProductErpRepository;

    constructor (productServices : ProductServices , productErpRepository: ProductErpRepository ){
            this.productServices =productServices;
            this.productErpRepository = productErpRepository;
    }


    async syncProduct(priceTable:number,erpCodeProduct?:number,){
            const dataProduct = await this.productErpRepository.findProductsForShipping(false, erpCodeProduct);

            console.log(`[!] ${dataProduct.length} Produtos encontrados para envio.`);
          if(dataProduct.length){

                const partialProduct = dataProduct[0];
                        if(partialProduct.id_produto_nuvemshop){
                                const {  id_variante_nuvemshop, id_produto_nuvemshop  } = partialProduct;
                         return   await this.productServices.updateProductByErpCode(partialProduct.CODIGO_ERP,   id_produto_nuvemshop, Number(id_variante_nuvemshop), priceTable,  true);
                        }else{
                         return await this.productServices.createProductByErpCode(partialProduct.CODIGO_ERP, priceTable);
                        }
                }else{
                    return { success: false, message:`Produto Código: ${erpCodeProduct} não foi encontrado.`, data: null }
          }

    }



}
/*
const productServices = ProductServicesFactory.createProductServices();
const productErpRepository = new ProductErpRepository(conn2, db_publico, database_api, db_estoque, db_vendas);

const script = new ScriptSyncProducts(productServices, productErpRepository, delay);

const TABELA_PRECO = process.env.TABELA_PRECO!;

await script.syncProduct(Number(TABELA_PRECO));*/