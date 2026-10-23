import { conn2, db_publico, db_vendas } from "../../../database/database-connection.ts"
import { NuvemshopApi } from "../../../shared/api/api.ts"
import { DateService } from "../../../shared/utils/date-service.ts"
import { FormatString } from "../../../shared/utils/format-string.ts"
import { CustomerMapper } from "../customer-mapper.ts"
import { OrderMapper } from "../order-mapper.ts"
import { OrderRequest } from "../order-request.ts"
import { CustomerRepository } from "../repositories/cutomer-repository.ts"
import { OrderRepository } from "../repositories/order-repository.ts"
import { CustomerService } from "./customer-service.ts"
import { ReceiveOrderService } from "./receive-order-service.ts"

export class ReceiveOrderServiceFactory{

    static createReceiveService(){
    const API_TOKEN: string = process.env.API_TOKEN!
    const API_BASE_URL: string = process.env.API_BASE_URL!
    const API_VERSION: string = process.env.API_VERSION!
    const ID_LOJA: string = process.env.ID_LOJA!
    const APPLICATION_URL: string = process.env.APPLICATION_URL!
        const nuvemshopApi = new NuvemshopApi(API_BASE_URL, API_VERSION, ID_LOJA, API_TOKEN, APPLICATION_URL);

        const orderRepository = new OrderRepository(conn2, db_publico, db_vendas);
        const orderMapper = new OrderMapper(new DateService());
        const orderRequest = new OrderRequest(nuvemshopApi.api)
        const customerMapper = new CustomerMapper(new FormatString(), new DateService());
        const customerRepository = new CustomerRepository(conn2, db_publico);
        const customerService = new CustomerService(customerMapper, customerRepository);

        return new ReceiveOrderService(
                orderRepository,
                orderMapper,
                orderRequest,
                customerService
        )
    }
}
 