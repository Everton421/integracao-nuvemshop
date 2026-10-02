
import { getShopify } from "../../../shared/api/api.ts";
import { LocaisIntegration } from "../repository/locais-integration-repository.ts";

import { VerifyItemLocation } from "./verify-item-location-service.ts";


export const QueryGetAllLocation =
    `query {
  locations(first: 100) {
    edges {
      node {
        id
        name
        address {
          formatted
        }
      }
    }
  }
}
`


type Locations =
    {
        locations: {
            edges: [
                {
                    node: {
                        id: string,
                        name: string,
                        address: {
                            formatted: [
                                string
                            ]
                        }
                    }
                }
            ]
        }
    }


export class GetLocation {

    async getAllLocation() {
        const locaisIntegration = new LocaisIntegration();
        const verifyItemLocation = new VerifyItemLocation();

        const query = QueryGetAllLocation;
        const shopify = await getShopify();
        try {

            const result = await shopify.request(query);
            const data = result.data as Locations;
            const errors = result.errors;

            if (errors) {
                console.error(errors);
                return { sucess: false, message: `Erro shopify: ${errors?.graphQLErrors?.[0]?.message || 'Desconhecido'}` };
            }

            if (data && data.locations.edges.length > 0) {
                for (const edge of data.locations.edges) {

                    let setor = 0;
                    let resultInsertNewLocal;

                    const resultLocal = await locaisIntegration.select({ id_shopify: edge.node.id });


                    // local encontrado 
                    if (resultLocal.length > 0) {

                        await locaisIntegration.update({
                            nome: edge.node.name,
                        }, edge.node.id);

                        await verifyItemLocation.verify(edge.node.id)

                    } else {

                        resultInsertNewLocal = await locaisIntegration.insert({
                            id: edge.node.id,
                            nome: edge.node.name,
                        });
                        await verifyItemLocation.verify(edge.node.id)

                    }
                }

                return { sucess: true, message: "Locais sincronizados com sucesso." };
            } else {
                return { sucess: false, message: "Nenhum local encontrado na Shopify." };
            }

        } catch (error) {
            console.error(error);
            return { sucess: false, message: "Erro interno ao buscar locais.", };
        }
    }


}