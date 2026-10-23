import { DateService } from "../../../shared/utils/date-service.ts";
import { OrderMapper } from "../order-mapper.ts";
import { OrderRequest } from "../order-request.ts";
import { OrderRepository } from "../repositories/order-repository.ts";
import { type GetOrdersInput } from "../types/type-input-order-request.ts";
import { type NuvemshopOrder } from "../types/types-order-request.ts";
import { CustomerService } from "./customer-service.ts";


export class ReceiveOrderService {

    private orderRepository: OrderRepository;
    private orderMapper: OrderMapper;
    private orderRequest: OrderRequest;
    private customerService: CustomerService;

    constructor(orderRepository: OrderRepository, orderMapper: OrderMapper, orderRequest: OrderRequest,customerService: CustomerService  ) {
        this.orderRepository = orderRepository;
        this.orderMapper = orderMapper;
        this.orderRequest = orderRequest;
        this.customerService = customerService;
    }


    async syncOrder( inputRequest: GetOrdersInput, seller:number, priceTable:number ){
            const responseOrderRequest = await this.orderRequest.getOrders<NuvemshopOrder[]>( inputRequest );
            return this.processOrders(responseOrderRequest, seller, priceTable);
    }

    /**
     * Busca os pedidos da Nuvemshop em um periodo (data inicial e final) e importa
     * para o ERP. Percorre todas as paginas da API ate trazer todos os pedidos.
     * @param dataInicio data/hora inicial no formato 'YYYY-MM-DDTHH:mm'
     * @param dataFim data/hora final no formato 'YYYY-MM-DDTHH:mm' (opcional)
     * @param seller codigo do vendedor no ERP
     * @param priceTable tabela de precos usada nos itens
     * @returns total de pedidos processados
     */
    async syncOrdersByPeriod(dataInicio: string, dataFim: string | undefined, seller: number, priceTable: number): Promise<number> {
        const PER_PAGE = 50;
        const createdAtMin = `${dataInicio}:00-03:00`;
        const createdAtMax = dataFim ? `${dataFim}:59-03:00` : undefined;

        let page = 1;
        let totalProcessed = 0;

        while (true) {
            const input: GetOrdersInput = {
                status: 'any',
                per_page: PER_PAGE,
                page,
                created_at_min: createdAtMin,
            };

            if (createdAtMax) {
                input.created_at_max = createdAtMax;
            }

            console.log(`[!] Buscando pedidos na Nuvemshop (pagina ${page}) ... `);
            const orders = await this.orderRequest.getOrders<NuvemshopOrder[]>(input);

            if (!orders.length) {
                break;
            }

            totalProcessed += await this.processOrders(orders, seller, priceTable);

            if (orders.length < PER_PAGE) {
                break;
            }

            page++;
        }

        return totalProcessed;
    }

    /**
     * Processa a lista de pedidos retornada pela Nuvemshop, inserindo/atualizando no ERP.
     * @param orders pedidos retornados pela Nuvemshop
     * @param seller codigo do vendedor no ERP
     * @param priceTable tabela de precos usada nos itens
     * @returns quantidade de pedidos processados
     */
    private async processOrders( orders: NuvemshopOrder[], seller:number, priceTable:number ): Promise<number> {
        const dataService = new DateService();
        let processed = 0;

        for (const order of orders) {
            // sincroniza o cliente, retornando os dados.
            const resultSyncCustomer = await this.customerService.syncCustomer(order.customer, 1);

            if (resultSyncCustomer.success) {
                //codigo do cliente no ERP.
                const customerCode = resultSyncCustomer.data.CODIGO!;

                // verifica se o pedido existe.
                const verifyExistsOrder = await this.orderRepository.verifyExistsOrder(String(order.id));

                if (verifyExistsOrder.length) {
                    console.log(`[V] Pedido encontrado, comparando data de atualização ...`);

                    const { DATA_RECAD: dataRecadExistsOrder, CODIGO: codeExistsOrder } = verifyExistsOrder[0];
                    // compara a data de atualização do pedido.
                    if (new Date(order.updated_at) > new Date(dataRecadExistsOrder)) {

                        console.log(`[V] Atualizando pedido: ${codeExistsOrder} no ERP... | ${dataService.formatarDataHora(order.updated_at) } > ${dataService.formatarDataHora(dataRecadExistsOrder)}`);
                        const resultUpdateOrder = await this.updateOrder(codeExistsOrder, order, customerCode, seller, priceTable);

                    } else {
                        console.log(`[V]  pedido: ${codeExistsOrder} não precisa de atualização no ERP...`);
                     //   return 1
                    }
                } else {
                    console.log(`[!] Pedido ${order.id} não foi encontrado no ERP, inserindo novo pedido...`);
                      const resultInsertOrder = await this.insertOrder(order, customerCode, seller, priceTable);
                        console.log(resultInsertOrder);
                }

                processed++;
            }
        }

        return processed;
    }

    /**
     * 
     * @param dataCadOrcaToInsert Dados para inserir na tabela ( cad_orca ).
     * @param dataProOrcaToInsert Dados para inserir na tabela ( pro_orca ).
     * @param dataParOrcaToInsert Dados para inserir na tabela ( par_orca ).
     * @returns Retorna o codigo do pedido
     */
   private async insertOrder(nuvemshopOrder: NuvemshopOrder, erpCustomerCode: number, seller: number, priceTable: number) {
        try {

            const dataCadOrcaToInsert = this.orderMapper.orderMapp(nuvemshopOrder, erpCustomerCode, seller);

            const resultInsertCadOrca = await this.orderRepository.insertCadOrca(dataCadOrcaToInsert);

            if (resultInsertCadOrca.insertId) {
                const orderCode = resultInsertCadOrca.insertId;

                const dataProOrcaToInsert = this.orderMapper.itensOrderMapp(nuvemshopOrder, erpCustomerCode, priceTable);
                await this.orderRepository.insertProOrca(dataProOrcaToInsert, orderCode);

                const dataParOrcaToInsert = this.orderMapper.installmentsOrderMapp(nuvemshopOrder, orderCode);
                await this.orderRepository.insertParOrca(dataParOrcaToInsert, orderCode);

            }
            return resultInsertCadOrca.insertId;
        } catch (error) {
            throw error
        }
    }
    /**
     * 
     * @param erpOrderCode Código do pedido no ERP.
     * @param dataCadOrcaToUpdate Dados para inserir na tabela ( cad_orca ).
     * @param dataProOrcaToUpdate Dados para inserir na tabela ( pro_orca ).
     * @param dataParOrcaToUpdate Dados para inserir na tabela ( par_orca ).
     * @returns 
     */
   private async updateOrder(erpOrderCode: number, nuvemshopOrder: NuvemshopOrder, erpCustomerCode: number, seller: number, priceTable: number) {
        try {
            const dataCadOrcaToUpdate = this.orderMapper.orderMapp(nuvemshopOrder, erpCustomerCode, seller);

            const resulUpdateOrder = await this.orderRepository.updateCadOrca(dataCadOrcaToUpdate, erpOrderCode);

            if (resulUpdateOrder.affectedRows) {
                await this.orderRepository.deleteProOrca(erpOrderCode);
                const dataProOrcaToUpdate = this.orderMapper.itensOrderMapp(nuvemshopOrder, erpCustomerCode, priceTable);
                await this.orderRepository.insertProOrca(dataProOrcaToUpdate, erpOrderCode);

                await this.orderRepository.delteParOrca(erpOrderCode);
                const dataParOrcaToUpdate = this.orderMapper.installmentsOrderMapp(nuvemshopOrder, erpOrderCode);
                await this.orderRepository.insertParOrca(dataParOrcaToUpdate, erpOrderCode);
            }

            return resulUpdateOrder.affectedRows;
        } catch (error) {
            throw error
        }
    }


}