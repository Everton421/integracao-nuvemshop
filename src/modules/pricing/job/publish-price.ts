import { delay } from "../../../shared/utils/delay.ts";
import { ConfiguracoesIntegration } from "../../config-integration/configuracoes-integration-repository.ts";
import { VarianteIntegration } from "../../products/repository/variants-integration.ts";
import { ErpPriceRepository } from "../repository/erp-price-repository.ts";  
import { UpdatePrecoService } from "../service/update-preco-service.ts";  

export async function publishPrice(codigo: number) {
        const erpPriceRepository = new ErpPriceRepository();


    const varianteIntegration = new VarianteIntegration();
    const configuracoesIntegration = new ConfiguracoesIntegration();
    const updatePrecoService = new UpdatePrecoService();

    let tabela = undefined;

    const resultConfig = await configuracoesIntegration.select();
    if (resultConfig.length > 0 && resultConfig[0].tabela_preco) {
        tabela = resultConfig[0].tabela_preco;
    }
    try {
        const resultPrice = await erpPriceRepository.findPriceErpProduct(codigo, tabela);
        if (!resultPrice.length) {
            return { sucess: false, message: `Nenhum preço do produto ${codigo} foi encontrado na tablea ${tabela}` }
        }
        const { DATA_RECAD, PRECO , PROMOCAO} = resultPrice[0];

        const resultVariant = await varianteIntegration.selectBySkuErp(codigo);
        if (!resultVariant.length) {
            return { sucess: false, message: `Não foi encontrado variante do produto ${codigo} (sem ID da Shopify).` }
        }
        const { id_produto_pai, variante_id } = resultVariant[0];

        await delay(250);

        const resultService = await updatePrecoService.post(
            {
                price: PRECO,
                promotion: PROMOCAO,
                variantId: variante_id,
                productId: id_produto_pai
            }, codigo, DATA_RECAD);

        if (resultService?.sucess) {
            return { sucess: true, message: resultService?.message }
        } else {
            return { sucess: false, message: resultService?.message || `Erro ao enviar preco | service publish-price |  preço SKU [ ${codigo} ] ` }
        }

    } catch (e: any) {
        console.error(`Erro service publish-price |  preço SKU [ ${codigo} ] `, e)
        return { sucess: false, message: `Erro service publish-price |  preço SKU [ ${codigo} ] ` }

    }

}
