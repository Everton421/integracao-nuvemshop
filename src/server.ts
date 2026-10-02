import bodyParser from 'body-parser';
import cors from 'cors';
import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import "express-async-errors";
import path from 'path';

import cookieParser from 'cookie-parser';
import { database_api } from './database/database-connection.ts';
import { seed } from './database/seed.ts';
import { router } from './web/routes.ts';
 
import { JobEstoqueLoja } from './modules/inventory/job/job-estoque-loja.ts';
import { JobEstoqueSc } from './modules/inventory/job/job-estoque-sc.ts';
import { JobPedido } from './modules/orders/job/job-pedido.ts';
import { JobProductsWithoutPhoto } from './modules/photos/job/job-get-products-without-photo.ts';
import { JobPreco } from './modules/pricing/job/job-preco.ts';
import { JobProdutos } from './modules/products/job/job-produtos.ts';
import { JobCategorias } from './modules/categories/job/job-categorias.ts';
import { consumer_sistema } from './shared/broker/consumer.ts';

    const app = express();
    const jobPedido = new JobPedido();

    app.use(express.json({ limit: '150mb' }));
    app.use(express.urlencoded({ limit: '150mb', extended: true }));

    app.set('view engine', 'ejs')
    app.use(bodyParser.urlencoded({ extended: true }))
    app.use(bodyParser.json())
    //  app.set('views', path.join(__dirname, 'Views'));
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
        const resultSeed = await seed()
    } else {
        throw new Error("Nome do banco de dados nao foi definido.")
    }

        const cronJob = process.env.CRON 
   

        if(cronJob && Number(cronJob) > 0 ){
            await new JobCategorias().job();
        } else{
            console.log("[X] tarefas cron desabilitada verificar process.env.CRON.")
        }

 


const PORT_API = process.env.PORT_API; // Porta padrão para HTTPS

app.listen(PORT_API, async () => {

    console.log(`app rodando porta ${PORT_API}  `)

})


