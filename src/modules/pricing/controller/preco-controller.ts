import { type Request, type Response } from "express";
import { delay } from "../../../shared/utils/delay.ts";
import { ConfiguracoesIntegration } from "../../config-integration/configuracoes-integration-repository.ts";
import { VarianteIntegration } from "../../products/repository/variants-integration.ts";
import { UpdatePrecoService } from "../service/update-preco-service.ts";  
import { ErpPriceRepository } from "../repository/erp-price-repository.ts";  
import { CompanyRepository } from "../../company/company-repository.ts";
import { VerifyDatePromotion } from "../utils/verify-date-promotion.ts";
import { DateService } from "../../../shared/utils/date-service.ts";

export class PrecoController {

    

    async post(req: Request, res: Response) {
        const companyRepository: CompanyRepository = new CompanyRepository() ;
        const verifyDatePromotion = new VerifyDatePromotion();

        const varianteIntegration = new VarianteIntegration();
        const configuracoesIntegration = new ConfiguracoesIntegration();
        const erpPriceRepository = new ErpPriceRepository();
        const dataService = new DateService();
        const currentDate = dataService.obterDataAtual();

        const arrproducts = req.body.produtos as string[];

        const resultIndiceErp = await companyRepository.findIndiceErpParams();
            const {  INDICE } = resultIndiceErp[0];

        const resultConfig = await configuracoesIntegration.select();
        let tabela = undefined;

        if (!resultConfig.length) {
            return res.status(400).json({ sucess: false, message: "Integração Não possui registro de configuração" })
        }


        if (resultConfig.length > 0 && resultConfig[0].tabela_preco) {
            tabela = resultConfig[0].tabela_preco;
        }

        if (resultConfig.length > 0 && resultConfig[0].enviar_produtos && resultConfig[0].enviar_produtos === 'N') {
            return res.status(400).json({ sucess: false, message: "Integração nao esta habilitada para enviar/atualizar produtos" })
        }


        if (!Array.isArray(arrproducts)) {
            return res.status(400).json({ sucess: false, message: "É necessario informar um array com os codigo dos itens" })
        }
        if (Array.isArray(arrproducts) && arrproducts.length === 0) {
            return res.status(400).json({ sucess: false, message: "Nenhum item selecionado " })
        }

        const updatePrecoService = new UpdatePrecoService();

        const sucessos: string[] = [];
        const erros: any[] = [];

        for (const i of arrproducts) {
            try {
                const resultPrice = await erpPriceRepository.findPriceErpProduct(Number(i), tabela);


                if (!resultPrice.length) {
                    erros.push({ codigo: i, erro: `Nenhum preço do produto ${Number(i)} foi encontrado na tablea ${tabela}` })
                    continue;
                }
                const { DATA_RECAD, PRECO , PROMOCAO, INDEXADO ,VALID_PROM } = resultPrice[0];
                const isPromotion = verifyDatePromotion.verify(currentDate,VALID_PROM );

                let productPrice = PRECO;
                let productPromotion =  PROMOCAO > 0 && isPromotion ? PROMOCAO : 0   ;

                if(INDEXADO === 'S' )  productPrice = PRECO * INDICE; 
                if(INDEXADO === 'S' )  productPromotion = isPromotion ? (PROMOCAO * INDICE) : 0 ;  


                const resultVariant = await varianteIntegration.selectBySkuErp(Number(i));
                if (!resultVariant.length) {
                    erros.push({ codigo: i, erro: `Não foi encontrado variante do produto ${Number(i)} (sem ID da Shopify).` })
                    continue;
                }
                const { id_produto_pai, variante_id } = resultVariant[0];

                await delay(500);

                const resultService = await updatePrecoService.post(
                    {
                        price: productPrice,
                        promotion: productPromotion,
                        variantId: variante_id,
                        productId: id_produto_pai
                    }, Number(i), DATA_RECAD);

                if (resultService?.sucess) {
                    sucessos.push(i);
                } else {
                    erros.push({ codigo: i, err: resultService?.message });
                }

            } catch (e: any) {
                console.error(`Erro controller preço SKU ${i}`, e)
                erros.push({ codigo: i, erro: e.message || "Erro desconhecido" });
            }

        }

        return res.status(200).json({
            sucess: true,
            message: `Processamento finalizado. Sucessos : ${sucessos.length}, Falhas: ${erros.length} `,
            details: {
                enviados: sucessos,
                falhas: erros
            }
        })
    }
}