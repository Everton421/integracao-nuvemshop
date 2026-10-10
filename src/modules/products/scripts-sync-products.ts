import { conn2, database_api, db_estoque, db_publico, db_vendas } from "../../database/database-connection.ts";
import { delay, type typeDelayFunction } from "../../shared/utils/delay.ts";
import { ProductServicesFactory } from "./product-services-factory.ts";
import { ProductErpRepository } from "./repository/produto-repository.ts";
import { ProductServices } from "./product-services.ts";


export class ScriptSyncProducts{
    private productServices : ProductServices
    private productErpRepository:ProductErpRepository;
           private delay : typeDelayFunction

    constructor (productServices : ProductServices , productErpRepository: ProductErpRepository, delay : typeDelayFunction){
            this.productServices =productServices;
            this.productErpRepository = productErpRepository;
           this.delay =delay 
    }


    async syncProduct(priceTable:number){
            const dataProduct = await this.productErpRepository.findProductsForShipping(true);

            console.log(`[!] ${dataProduct.length} Produtos encontrados para envio.`);

            for(const [index, partialProduct] of dataProduct.entries() ){
                    console.log(`[V] Processando produtos [ ${index} de ${dataProduct.length}] ... `)
                    if(partialProduct.id_produto_nuvemshop){
                        const {  id_variante_nuvemshop, id_produto_nuvemshop  } = partialProduct;
                        await this.productServices.updateProductByErpCode(partialProduct.CODIGO_ERP,   id_produto_nuvemshop, Number(id_variante_nuvemshop), priceTable,  true);
                     }else{
                        await this.productServices.createProductByErpCode(partialProduct.CODIGO_ERP, priceTable);
                    }
            }
    }
}

const productServices = ProductServicesFactory.createProductServices();
const productErpRepository = new ProductErpRepository(conn2, db_publico, database_api, db_estoque, db_vendas);

const script = new ScriptSyncProducts(productServices, productErpRepository, delay);

const TABELA_PRECO = process.env.TABELA_PRECO!;

await script.syncProduct(Number(TABELA_PRECO));