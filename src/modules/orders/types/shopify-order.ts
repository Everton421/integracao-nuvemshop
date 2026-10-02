
export type typeRequestShopifyOrder = {

    id: string
    name: string,
    localizedFields: {
        edges: [
            {
                node: {
                    countryCode: string // "BR" 
                    purpose: string // "TAX" 
                    title: string // titulo do campo: "CPF/CNPJ"  
                    value: string // cnpj/cfp
                }
            }
        ]
    }
    note: string,
    createdAt: string
    updatedAt: string
    displayFinancialStatus: 'AUTHORIZED' | 'EXPIRED' | 'PAID' | 'PARTIALLY_PAID' | 'PARTIALLY_REFUNDED' | 'PENDING' | 'REFUNDED' | 'VOIDED',
    displayFulfillmentStatus: 'UNFULFILLED' | 'SCHEDULED' | 'RESTOCKED' | 'REQUEST_DECLINED' | 'PENDING_FULFILLMENT' | 'PARTIALLY_FULFILLED' | 'OPEN' | 'ON_HOLD' | 'IN_PROGRESS' | 'FULFILLED'
    currentShippingPriceSet: {
        shopMoney: {
            amount: string | number
        }
    },
    totalPriceSet: {
        shopMoney: {
            amount: string | number,
            currencyCode: string | 'BRL'
        }
    },
    email: string
    shippingAddress: {
        address1: string
        address2: string | null
        zip: string // cep
        city: string,
        provinceCode: string // UF
    }
    customer: {
        firstName: string
        lastName: string
        displayName: string
        email: string
        id: string
        phone: string
    },
    lineItems: {
        nodes: [
            {
                id: string
                name: string
                sku: string
                quantity: number
                currentQuantity: number
                variant: {
                    id: string
                    inventoryItem: {
                        id: string
                        inventoryLevels: {
                            edges: [
                                {
                                    node: {
                                        location: {
                                            id: string
                                            name: string
                                        }
                                    }
                                }
                            ]
                        }
                    }
                },
                originalUnitPriceSet: {
                    shopMoney: {
                        amount: string | number
                        currencyCode: string | 'BRL'
                    }
                }
                discountedTotalSet: {
                    shopMoney: {
                        amount: string | number
                        currencyCode: string | 'BRL'
                    }
                }
            }

        ]
    }

}


export type clientRequest = {
    rua: string
    cep: string
    cidade: string
    uf: string
    cnpj: string
    nome: string
    email: string
    clientId: string
    telefone: string
    vendedor: number
}