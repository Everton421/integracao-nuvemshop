import { getShopify } from "../../shared/api/api.ts"


export type Address = {
    address1: string; // Rua, Número, Bairro
    address2: string | null; // Complemento
    city: string;
    provinceCode: string; // UF
    zip: string;
    company: string | null;
    countryCode: string;
}

export type custumer = {
    id: string,
    firstName: string,
    lastName: string,
    email: string,
    phone: string
    displayName: string
    numberOfOrders: number | string,
    amountSpent: {
        amount: string | number,
        currencyCode: string | "BRL"
    },
    createdAt: string,
    updatedAt: string
    note: string
    verifiedEmail: boolean,
    validEmailAddress: boolean,
    tags: [],
    lifetimeDuration: string,
      defaultAddress: Address | null;
    addresses: Address[];
    image: {},
    canDelete: boolean
}


export class GetCustomerRequest {

    async getById(id: string) {
        const shopify = await getShopify();

        const shopifyId = `\`${id}\``
        const query = `
            query {

                customer( id: "${id}"){
                        id
                        firstName
                        lastName
                        email
                        phone
                        displayName
                        numberOfOrders
                        amountSpent {
                            amount
                            currencyCode
                        }
                        createdAt
                        updatedAt
                        note
                        verifiedEmail
                        validEmailAddress
                        tags
                        lifetimeDuration
                        defaultAddress {
                            formattedArea
                            address1
                            address2
                            province
                            provinceCode
                            zip
                            countryCode
                        }
                        addresses {
                            address1
                            address2
                            city
                            provinceCode
                            zip
                            company
                        }
                        image {
                            src
                        }
                        canDelete
                        }
                    }  
                `

        const { data, errors } = await shopify.request(query)

        if (data) {
            console.log(data.customer.addresses);
            return data
        }

        if (errors) {
            console.log("ERRO:", errors);
        }


    }

}