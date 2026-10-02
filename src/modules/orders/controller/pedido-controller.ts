import { type Request, type Response } from "express";
import { DateService } from "../../../shared/utils/date-service.ts";
import { ConfiguracoesIntegration } from "../../config-integration/configuracoes-integration-repository.ts";
import { GetPedidosService } from "../services/get-orders-service.ts";

export class PedidoController {

    async getpedidos(req: Request, res: Response) {
        const dateService = new DateService();
        const configuracoesIntegration = new ConfiguracoesIntegration();
        const getPedidosService = new GetPedidosService();

        const data_inicio = String(req.body.data_inicio);
        const data = dateService.formatarData(data_inicio)


        const config = await configuracoesIntegration.select();
        if (!config.length) {
            return res.status(400).json({ message: "É necessario incluir as infomações de configuração da aplicação " })
        } else {

            if (config[0].importar_pedidos === 'N') {
                return res.status(400).json({ message: "a integração não esta configurada para receber pedidos." })
            }
            const responseGetPedido = await getPedidosService.getPedidos(data)

            if (responseGetPedido.length > 0) {
                return res.status(200).json({ message: "Pedidos processados, verifique os logs da aplicação." })
            }

        }

    }

}