import {type cad_clie } from "../../shared/interfaces/cad_clie.ts";
import { type LogsIntegracao } from "../../shared/interfaces/logs-integracao.ts";
import { DateService } from "../../shared/utils/date-service.ts";
import { ConfiguracoesIntegration } from "../config-integration/configuracoes-integration-repository.ts";
import { LogsIntegration } from "../logs/log-integration.ts";
import { ClienteRepository } from "./cliente-repository.ts";

 export class GetClientService{

        /**
         * Recebe o cliente mapeado para registrar no banco de dados do erp
         * @param clientMapped objeto com os dados para atualizar/inserir cliente no erp 
         * @returns 
         */
    static async insertOrUpdateCLient(clientMapped:cad_clie){

            let log = { action: '', referencia: 'order', message: '', referencia_id: 0, status: 'sucess', dados_shopify: JSON.stringify(clientMapped) } as Omit<LogsIntegracao, 'id' | 'created_at'>;
        
            let codigo_cliente = 0;
            const dateService = new DateService();
            const logIntegration = new LogsIntegration();
            const configuracoesIntegration = new ConfiguracoesIntegration();

            const dataConfig = await configuracoesIntegration.select();
            let vendedor = 1;

            if (dataConfig.length > 0) {
                vendedor = dataConfig[0].vendedor_pedido
            }


               let dataClient = clientMapped as cad_clie & { CODIGO:number}
        
                    const validCliente = await ClienteRepository.buscaPorcnpj(clientMapped.CPF);
        
                            if (validCliente.length > 0) {

                              dataClient = { ...dataClient, CODIGO:  validCliente[0].CODIGO } ;
                                codigo_cliente = validCliente[0].CODIGO;    
                                
                                    try{

                                        console.log(` [V] Atualizando cliente ${dataClient.NOME}`);

                                        const resultUpdateClient = await ClienteRepository.updateClientErp(dataClient)
                                        if (resultUpdateClient.affectedRows > 0) {
                                            console.log("cliente atualizado com sucesso")
                                        } 
                                    }catch(e){
                                            log.message = `Ocorreu um erro ao tentar atualizar o cliente  : ${dataClient.APELIDO}  [ ${dateService.obterDataHoraAtual()} ]`
                                        log.action = `atualizar cliente`;
                                        log.status = 'error';
                                        await logIntegration.insert(log);
                                    }
                             
                            } else {

                                try{
                                const resultInsertCliente = await ClienteRepository.cadastrarClientErp(dataClient);
        
                                 codigo_cliente = resultInsertCliente.insertId

                                }catch(e){
                                        console.log(`Erro ao tentar atualizar cliente ${e}`);
                                            log.message = `Ocorreu um erro ao tentar registrar o   cliente  : ${dataClient.APELIDO}  [ ${dateService.obterDataHoraAtual()}  `
                                            log.action = `cadastrar cliente`;
                                            log.status = 'error';
                                            await logIntegration.insert(log);
                                }
                              //  try{
                              //  const resultInsertVendClie = await ClienteRepository.cadastrarVendedorCliente(codigo_cliente, vendedor, 1, 0);
                              //          if (resultInsertVendClie.insertId > 0) console.log("cliente registrado com sucesso")
                              //          
                              //       }catch(e){
                              //          console.log(`Erro ao tentar registrar vendedor no cliente ${e}`);
                              //  }
                                
                            }
                            
                              return codigo_cliente;

                              
                        }
 }