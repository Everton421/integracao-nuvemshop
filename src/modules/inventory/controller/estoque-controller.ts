import { type Request, type Response } from "express";
import { ConfiguracoesIntegration } from "../../config-integration/configuracoes-integration-repository.ts";
import { VariantesLocaisIntegration } from "../../products/repository/variantes-locais-integration.ts";
import { DateService } from "../../../shared/utils/date-service.ts";
import { ErpInventoryRepository } from "../repository/erp-inventory-repository.ts";
import { UpdateEstoqueService } from "../service/update-estoque-service.ts";
import { InventoryActivate } from "../service/inventory-activate-service.ts";
import { DeactivateInventoryService } from "../service/deactivate-inventory-service.ts";
import { SyncEstoqueLojaService } from "../service/sync-estoque-loja-service.ts";
import { SyncEstoqueScService } from "../service/sync-estoque-sc-service.ts";


export class EstoqueController {

    async postSaldo(req: Request, res: Response) {

        const configuracoesIntegration = new ConfiguracoesIntegration();
        const variantesLocaisIntegration = new VariantesLocaisIntegration();
        const dateService = new DateService();
        const inventoryRepository = new ErpInventoryRepository();

        const resultConfig = await configuracoesIntegration.select();

        if (!resultConfig.length) {
            return res.status(400).json({ sucess: false, message: "Integração Não possui registro de configuração" })
        }

        if (resultConfig.length > 0 && resultConfig[0].enviar_produtos && resultConfig[0].enviar_produtos === 'N') {
            return res.status(400).json({ sucess: false, message: "Integração nao esta habilitada para enviar/atualizar produtos" })
        }


        const arrproducts = req.body.produtos as string[];

        if (!Array.isArray(arrproducts)) return res.status(400).json({ sucess: false, message: "É necessario informar um array com os codigo dos itens" })

        if (Array.isArray(arrproducts) && arrproducts.length === 0) return res.status(400).json({ sucess: false, message: "Nenhum item selecionado " })

        const updateEstoqueService = new UpdateEstoqueService();

        const sucessos: string[] = [];
        const erros: any[] = [];
                let resultEstoqueLoja;
                let resultEstoqueSc;

        for (const i of arrproducts) {
                resultEstoqueLoja =  await SyncEstoqueLojaService.exec(Number(i));
                if( resultEstoqueLoja && resultEstoqueLoja.falhas){
                    for(const falha of resultEstoqueLoja.falhas ){
                        erros.push(falha);
                    }
                }
               if(resultEstoqueLoja && resultEstoqueLoja.enviados){
                     for( const sucesso of resultEstoqueLoja.enviados){
                        sucessos.push(sucesso)
                    }
                }

                resultEstoqueSc =  await SyncEstoqueScService.exec(Number(i));
                if(resultEstoqueSc && resultEstoqueSc.falhas)  {
                    for(const falha of resultEstoqueSc.falhas){
                        erros.push(falha);
                    }
                } 
                
                if(resultEstoqueSc && resultEstoqueSc.enviados ){
                    for( const sucesso of resultEstoqueSc.enviados){
                        sucessos.push(sucesso)
                    }
                }
                

        }

        return res.status(200).json({
            sucess: true,
            message: `Processamento finalizado. Sucessos : ${sucessos.length }, Falhas: ${erros.length}.`,
            enviados: sucessos,
            falhas: erros
        })

    }
}