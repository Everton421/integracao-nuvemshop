
import test from 'node:test';
 
import { conn2, database_api } from '../../../database/database-connection.ts';
import { ProductServicesFactory } from '../product-services-factory.ts';
import { ProductIntegration } from '../repository/produto-integration-repository.ts';

 


test("Envio do produto teste ", async ()=>{


    try {
         const codigoErp =840
         const productIntegration = new ProductIntegration(conn2, database_api);
         const dataProduct = await productIntegration.findByCodigoErp(codigoErp);
        const priceTable = process.env.TABELA_PRECO!;

        const service = ProductServicesFactory.createProductServices();
            if(dataProduct.length > 0 ){
                const { id_produto_nuvemshop, id_variante_nuvemshop } =dataProduct[0];

                console.log(`[!] Produto ${dataProduct[0].nome} já foi enviado`);
                   await  service.updateProductByErpCode(codigoErp, Number(id_produto_nuvemshop) ,Number(id_variante_nuvemshop),Number(priceTable) );

                   await service.updateVariantByErpCode(codigoErp, Number(id_produto_nuvemshop), Number(id_variante_nuvemshop), Number(priceTable) );
            }else{
              await service.createProductByErpCode(codigoErp, Number(priceTable))
            }
    
    } catch (error) {
            console.log(error);
    }
 })