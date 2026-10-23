import { type Request, type Response } from "express";
import { InventoryRepository } from "../inventory-repository.ts";
import { conn2, database_api, db_estoque, db_publico, db_vendas } from "../../../database/database-connection.ts";
import { InventoryServicesFactory } from "../inventory-services-factory.ts";
import { delay } from "../../../shared/utils/delay.ts";
import { ConfigIntegrationRepository } from "../../config-integration/config-integration-repository.ts";


export class InventoryController {

    async postStock(req: Request, res: Response) {

        const erpCodeProducts: string[] = req.body.produtos;
        const inventoryRepository = new InventoryRepository(conn2, db_publico, database_api, db_estoque, db_vendas)
        const inventoryService = InventoryServicesFactory.createInventoryService();
         
             console.log(`[V] Enviando Estoque...`)

        let processed = 1;
  
        let success =0;
        let errors =0;
        let message =[]
            for(const erpCodeProduct of erpCodeProducts ){
              
              const stockProductToShipping = await  inventoryRepository.findStockProductToShipping(Number(erpCodeProduct));
                if(stockProductToShipping.length){

                        const [{  ESTOQUE }] = stockProductToShipping;
                        await  delay(500, `Envio Estoque [ ${processed} de ${stockProductToShipping.length} ]...`)
                        const responseInventory = await inventoryService.updateInventory({ code: Number(erpCodeProduct), stock:  ESTOQUE  })
                        if(responseInventory.success ) success++;
                        if(!responseInventory.success) errors++;
                        message.push(responseInventory.message)
                        processed++

                    }else{
                        errors++;
                        message.push(`Não foi encontrado registro de estoque para o produto ${Number(erpCodeProduct)} \n`);
                    }

                }
        return res.status(200).json({ success ,errors, message: `Fim do processo! \n Erros: ${errors} \n Sucessos: ${success} \n ${message.join(' \n ').toString()}`})

    }


        async postPrice(req: Request, res: Response) {

            const erpCodeProducts: string[] = req.body.produtos;
            const inventoryRepository = new InventoryRepository(conn2, db_publico, database_api, db_estoque, db_vendas)
            const inventoryService = InventoryServicesFactory.createInventoryService();
            
            const configIntegrationRepository = new ConfigIntegrationRepository(conn2, database_api);

            const [ { tabela_precos }] = await configIntegrationRepository.findAll();
            let processed = 1;
    
            let success =0;
            let errors =0;
            let message =[]
                for(const erpCodeProduct of erpCodeProducts ){
                
                const priceProductToShipping = await  inventoryRepository.findPriceProductToShipping(tabela_precos,Number(erpCodeProduct));
                 
                    if(priceProductToShipping.length){

                            const [{  PRECO, PROMOCAO }] = priceProductToShipping;

                            await  delay(500, `Envio preco [ ${processed} de ${priceProductToShipping.length} ]...`)
                            
                            const responseInventory = await inventoryService.updateInventory({ code: Number(erpCodeProduct),  price: PRECO, promotion:PROMOCAO });
                            
                            if(responseInventory.success ) success++;
                            if(!responseInventory.success) errors++;
                            
                            message.push(responseInventory.message)
                            processed++


                        }else{
                            errors++;
                            message.push(`Não foi encontrado registro de preço para o produto ${Number(erpCodeProduct)} \n`);
                        }

                    }
            return res.status(200).json({ success ,errors, message: `Fim do processo! \n Erros: ${errors} \n Sucessos: ${success} \n ${message.join(' \n ').toString()}`})

    }

}
