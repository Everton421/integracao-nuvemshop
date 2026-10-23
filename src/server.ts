import bodyParser from 'body-parser';
import cors from 'cors';
import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import "express-async-errors";
import path from 'path';

import cookieParser from 'cookie-parser';
import { conn2, database_api } from './database/database-connection.ts';
import { seed } from './database/seed.ts';
import { ConfigRepository } from './modules/config/repository/config-repository.ts';
import { InventoryJobFactory } from './modules/inventory/jobs/inventory-job-factory.ts';
import { ProductJobFactory } from './modules/products/jobs/product-job-factory.ts';
import { router } from './web/routes.ts';
import { JobCategoriesFactory } from './modules/categories/job/job-categories-factory.ts';
import { JobPedido } from './modules/orders/receive-order-job.ts';
import { ReceiveOrderServiceFactory } from './modules/orders/services/receive-order-service-factory.ts';
import { DateService } from './shared/utils/date-service.ts';
import { ConfigIntegrationRepository } from './modules/config-integration/config-integration-repository.ts';
 

    const app = express();

    app.use(express.json({ limit: '150mb' }));
    app.use(express.urlencoded({ limit: '150mb', extended: true }));

    app.set('view engine', 'ejs')
    app.use(bodyParser.urlencoded({ extended: true }))
    app.use(bodyParser.json())
    app.set('views', path.join(import.meta.dirname, '/web/Views'));

    app.use(express.json());
    app.use(router)
    app.use(cors());
    app.use(cookieParser());
    app.use(
        (err: Error, req: Request, res: Response, next: NextFunction) => {
            if (err instanceof Error) {
                return res.status(400).json({
                    error: err.message,
                })
            }
            res.status(500).json({
                status: 'error ',
                messsage: 'internal server error.'
            })
        })

    if (database_api) {
         await seed()
    } else {
        throw new Error("Nome do banco de dados nao foi definido.")
    }

         const dateService = new DateService();

         const configRepository = new ConfigRepository(conn2, database_api);
         const configIntegrationRepository = new ConfigIntegrationRepository(conn2, database_api );
         const  [{ tabela_precos, codigo_vendedor }] = await configIntegrationRepository.findAll();
          
         const modules = await configRepository.findAll()

        // product 
          const productJob = ProductJobFactory.createJob(1);
          const productModuleConfig = modules.find(( i )=> i.modulo == 'produtos');
             if(productModuleConfig &&  productModuleConfig.cron == 'S'){
                 productJob.job(productModuleConfig.expressao_cron);
             }

        // inventory
         const inventoryJob =  InventoryJobFactory.createJob();
         const stockModuleConfig = modules.find( ( i )=> i.modulo == 'estoque');
         
            if(stockModuleConfig && stockModuleConfig.cron == 'S'){
                inventoryJob.jobStock(stockModuleConfig.expressao_cron);
             }
            const priceModuleConfig = modules.find( ( i )=> i.modulo == 'precos');
             if(priceModuleConfig && priceModuleConfig.cron == 'S'){
                inventoryJob.jobPrice(priceModuleConfig.expressao_cron,  tabela_precos );
             }

         //categories
         const categoryJob = JobCategoriesFactory.createJob();    
         const categoryModuleConfig = modules.find( ( i )=> i.modulo == 'categorias');
             if( categoryModuleConfig && categoryModuleConfig.cron == 'S'){
                categoryJob.job(categoryModuleConfig.expressao_cron);
             }
         
         // Orders    
        const receiveOrderService = ReceiveOrderServiceFactory.createReceiveService();
        const receiveOrderJob= new JobPedido(receiveOrderService);
        const orderModuleConfig = modules.find( ( i )=> i.modulo == 'pedidos');

         if( orderModuleConfig && orderModuleConfig.cron == 'S' ){  
                 receiveOrderJob.job( orderModuleConfig.expressao_cron , { status: 'any', created_at_min: dateService.obterDataDiasAtraso(2)}, codigo_vendedor, tabela_precos )
            }

        const PORT_API = process.env.PORT_API;  

        app.listen(PORT_API, async () => {

            console.log(`app rodando porta ${PORT_API}  `)

        })


