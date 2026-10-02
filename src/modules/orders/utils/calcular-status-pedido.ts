import { type requestOrder } from "../get-order-request.ts";

export class CalcularStatus{
 static   calcularStatusPedidoShopify( order: requestOrder) {
    if (order.cancelledAt) {
        return "CANCELADO";
    }
    if (order.closedAt) {
        return "FECHADO/ARQUIVADO";
    }
    
    // Se não for cancelado nem fechado, olhamos o financeiro e entrega
    if (order.displayFinancialStatus === 'PAID' && order.displayFulfillmentStatus === 'FULFILLED') {
        return "CONCLUÍDO";
    }
    
    if (order.displayFinancialStatus === 'PAID' && order.displayFulfillmentStatus === 'UNFULFILLED') {
        return "PRONTO PARA FATURAR";
    }

    return "ABERTO";
}
}