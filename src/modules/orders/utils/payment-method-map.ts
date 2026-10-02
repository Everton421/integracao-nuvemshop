const GATEWAY_TO_FORMA_PAGAMENTO: Record<string, number> = {
    shopify_payments: 12,
    mercado_pago: 12,
    pix: 12,
    pagseguro: 12,
    pag_seguro: 12,
    paypal: 12,
    american_express: 12,
}

const GATEWAY_TO_TIPO_RECEB: Record<string, number> = {
    pix: 104,
    pagseguro: 103,
    pag_seguro: 103,
    paypal: 52,
    american_express: 68,
    shopify_payments: 104,
    mercado_pago: 104,
}

const FALLBACK_FORMA_PAGAMENTO = 12
const FALLBACK_TIPO_RECEB = 104

export function mapGateway(gateway?: string): { formaPagamento: number; tipoReceb: number } {
    if (!gateway) {
        return { formaPagamento: FALLBACK_FORMA_PAGAMENTO, tipoReceb: FALLBACK_TIPO_RECEB }
    }

    const key = gateway.toLowerCase().trim()

    return {
        formaPagamento: GATEWAY_TO_FORMA_PAGAMENTO[key] ?? FALLBACK_FORMA_PAGAMENTO,
        tipoReceb: GATEWAY_TO_TIPO_RECEB[key] ?? FALLBACK_TIPO_RECEB,
    }
}
