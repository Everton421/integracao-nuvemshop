import cron from 'node-cron';
import { DateService } from '../../../shared/utils/date-service.ts';
import { ConfiguracoesIntegration } from '../../config-integration/configuracoes-integration-repository.ts';
import { ErpPriceRepository } from '../repository/erp-price-repository.ts';  
import { VarianteIntegration } from '../../products/repository/variants-integration.ts';
import { UpdatePrecoService } from '../service/update-preco-service.ts';   
import { VerifyDatePromotion } from '../utils/verify-date-promotion.ts';
import { CompanyRepository } from '../../company/company-repository.ts';
import { delay } from '../../../shared/utils/delay.ts';
import { conn2, database_api, db_publico, db_vendas } from '../../../database/database-connection.ts';

type prodPreco = {
   PRECO: number, 
   PROMOCAO:number,
   VALOR_PROMOCAO:number
   PRODUTO: number, TABELA: number, DATA_RECAD: string,
   INDEXADO: 'S' | 'N',
   VALID_PROM:string
   ultimoPrecoEnviado: string,
   variante_id: string,
   id_produto_pai: string
   erp_sku:number
   INDICE:number
}


export class JobPreco {
     
    async job() {

        const dateService = new DateService()
        const configuracoesIntegration = new ConfiguracoesIntegration();

        let tabela = undefined as any;

        const configCron = process.env.ENVIAR_PRECO;

        if (!configCron) {
            return console.log("é necessario configurar a variavel ENVIAR_PRECO com a expressao cron. ")
        }



        let inExec = false;
        const obj = new JobPreco()
        cron.schedule(configCron, async () => {

            try {

                if (inExec) {
                    console.log("[X] Tarefa de verificação de preços ainda em execução.");
                    return;
                }
                inExec = true;

                let verifiIntegrationConfig = await configuracoesIntegration.select();
                if (!verifiIntegrationConfig.length) {
                    return console.log("integração nao esta configurada corretamente. verificar tabela [configuracoes]")
                }

                let { enviar_preco, tabela_preco, ultimo_envio_preco } = verifiIntegrationConfig[0];
                ultimo_envio_preco = dateService.formatarDataHora(ultimo_envio_preco);


                if (tabela_preco > 0) tabela = tabela_preco;

                if (enviar_preco === 'N') {
                    return console.log("integração nao esta configurada para enviar preco")
                }

                console.log('Executando tarefa [preço] ...')
                //await obj.verify(ultimo_envio_preco, tabela)
                 await obj.newVerify(tabela)

            } catch (e) {

            } finally {
                inExec = false;
            }
        });

    }


  

    
  
    async newVerify(tabela:number) {

        const database = `\`${database_api}\``;

        const updatePrecoService = new UpdatePrecoService();
        const dateService = new DateService()
        const configuracoesIntegration = new ConfiguracoesIntegration();

        let dataAtual = dateService.obterDataAtual();


             const sql = ` 
            SELECT 
                CAST(
                    IF(pc.INDEXADO = 'S', pp.PRECO * par.INDICE, pp.PRECO)
                    AS DECIMAL(20,2)
                ) as PRECO,
                DATE_FORMAT(pp.VALID_PROM, '%Y-%m-%d') as VALID_PROM,
                CAST(
                    IF(now() > pp.VALID_PROM, 0,
                        IF(pc.INDEXADO = 'S', pp.PROMOCAO * par.INDICE, pp.PROMOCAO)
                    )
                    AS DECIMAL(20,2)
                ) as PROMOCAO,
                pp.PRODUTO,
                pp.TABELA,
                pp.DATA_RECAD,
                pc.INDEXADO,
                v.variante_id,
                v.id_produto_pai,
                v.erp_sku,
                    par.INDICE
            FROM  ${database}.produtos p
            JOIN  ${database}.variantes v ON v.erp_sku = p.erp_sku
            JOIN  ${db_publico}.prod_tabprecos pp ON p.erp_sku = pp.PRODUTO
            JOIN ${db_publico}.tab_precos tp ON tp.codigo = pp.tabela
            LEFT JOIN ${db_publico}.prod_custos pc ON (pc.PRODUTO = pp.PRODUTO) AND (pc.FILIAL = 2)
            JOIN ${db_vendas}.parametros par ON par.ID = 1
            WHERE
                tp.CODIGO = ${tabela} 
                AND (
                    CAST(
                        IF(pc.INDEXADO = 'S', pp.PRECO * par.INDICE, pp.PRECO)
                        AS DECIMAL(10,2)
                    ) <> p.preco
                    OR CAST(
                        IF(now() > pp.VALID_PROM, 0,
                            IF(pc.INDEXADO = 'S', pp.PROMOCAO * par.INDICE, pp.PROMOCAO)
                        )
                        AS DECIMAL(10,2)
                    ) <> p.promocao
                )
            GROUP BY pp.PRODUTO; `

                    const [arrverifyPrice] = await conn2.query(sql);

                    const verifyPrice = arrverifyPrice as prodPreco[];


                if (verifyPrice.length > 0) {
                         console.log(`[V] Encontrado ${verifyPrice.length} preços para atualizar ...`);

                    for (const priceSistem of verifyPrice) {
                        
                        const { PRECO, PROMOCAO, VALID_PROM, INDEXADO, id_produto_pai, erp_sku, variante_id } = priceSistem;
                      

                        // const isPromotion = verifyDatePromotion.verify(dataAtual, VALID_PROM );
                         const isPromotion =  PROMOCAO && PROMOCAO > 0  ? true : false  ;
                         
                           let productPrice =   PRECO;
                           let productPromotion =    isPromotion ? PROMOCAO : 0   ;
                         

                            console.log(`Enviando preço para  o produto ${erp_sku}`);

                            await delay(250, `Atualização do preco do produto ${erp_sku}... `)

                            await updatePrecoService.post({
                                price: productPrice,
                                promotion: productPromotion,
                                productId: id_produto_pai,
                                variantId: variante_id,
                                data_promocao: VALID_PROM
                            },
                                Number(erp_sku),
                                dateService.formatarDataHora(priceSistem.DATA_RECAD)
                            )

                            console.log(`[V] Atualizado preço do produto ${erp_sku}`) 
                    }
                } else {
                     console.log(`Nenhum registro de preço pendente de envio. `);
                }

            await configuracoesIntegration.update({
                ultimo_envio_preco: dataAtual
            })


    }


    /**
     * 
     * @param ultimo_envio_preco data da ultima verificaçao de envio dos preços
     * @param tabela 
     */
    async verify(ultimo_envio_preco: string, tabela?: number) {
        const erpPriceRepository = new ErpPriceRepository();

        const varianteIntegration = new VarianteIntegration();
        const updatePrecoService = new UpdatePrecoService();
        const dateService = new DateService()
        const configuracoesIntegration = new ConfiguracoesIntegration();

        let dataAtual = dateService.obterDataAtual();
        const verifyDatePromotion = new VerifyDatePromotion();

        const companyRepository: CompanyRepository = new CompanyRepository() ;

        const variants = await varianteIntegration.selectAll()
    const resultIndiceErp = await companyRepository.findIndiceErpParams();

    const {  INDICE } = resultIndiceErp[0];
        if (variants.length > 0) {

            for (let i of variants) {

                const verifyPrice = await erpPriceRepository.findPriceErpProductUpdateAt(Number(i.erp_sku), dateService.formatarDataHora(ultimo_envio_preco), tabela);
                if (verifyPrice.length > 0) {

                    for (const priceSistem of verifyPrice) {
                        
                        const { PRECO, PROMOCAO, VALID_PROM, INDEXADO } = priceSistem;
                      

                        // const isPromotion = verifyDatePromotion.verify(dataAtual, VALID_PROM );
                         const isPromotion =  PROMOCAO && PROMOCAO > 0  ? true : false  ;
                         
                           let productPrice =   PRECO;
                           let productPromotion =    isPromotion ? PROMOCAO : 0   ;
                         
                          if( INDEXADO === 'S' )  productPrice =  PRECO * INDICE; 
                          if( INDEXADO === 'S' )  productPromotion = isPromotion ? (PROMOCAO * INDICE) : 0 ;  


                        if (new Date(priceSistem.DATA_RECAD) > new Date(ultimo_envio_preco)) {
                            console.log(` Data atualização preço sistema : [ ${dateService.formatarDataHora(priceSistem.DATA_RECAD)} ]  >  Data ultimo envio [ ${dateService.formatarDataHora(ultimo_envio_preco)} ] `)
                            console.log(`Enviando preço para  o produto ${i.erp_sku}`);

                            await delay(250, `Atualização do preco do produto ${i.erp_sku}... `)
                            await updatePrecoService.post({
                                price: productPrice,
                                promotion: productPromotion,
                                productId: i.id_produto_pai,
                                variantId: i.variante_id,
                                data_promocao: VALID_PROM
                            },
                                Number(i.erp_sku),
                                dateService.formatarDataHora(priceSistem.DATA_RECAD)
                            )
                            console.log(`[V] Atualizado preço do produto ${i.erp_sku}`) 
                        } else {
                            console.log(` Data atualização preço sistema : [ ${dateService.formatarDataHora(priceSistem.DATA_RECAD)} ]  <  Data ultimo envio [ ${dateService.formatarDataHora(ultimo_envio_preco)} ] `)
                            console.log(`não será enviando preço para  o produto ${i.erp_sku}`);
                        }
                    }
                } else {
                    //    console.log(`Nenhum registro de preço encontrado. produto : ${i.erp_sku} Alterado após ${dateService.formatarDataHora(ultimo_envio_preco)}`);
                }

            }
            await configuracoesIntegration.update({
                ultimo_envio_preco: dataAtual
            })

        } else {
            console.log("nenhuma variante encontrada.")
        }


    }


     async jobUpdateIndexado(){
                        console.log("INICIANDO SERVICO jobUpdateIndexado ")

          const configuracoesIntegration = new ConfiguracoesIntegration();
          const erpPriceRepository = new  ErpPriceRepository();
        const varianteIntegration = new VarianteIntegration();
         const companyRepository: CompanyRepository = new CompanyRepository() ;
         const verifyDatePromotion = new VerifyDatePromotion();
        const dateService = new DateService();


        const currentDate = dateService.obterDataAtual();

        let tabela = undefined as any;
        const updatePrecoService = new UpdatePrecoService();

        const configCron = process.env.ENVIAR_PRECO;

        if (!configCron) {
            return console.log("é necessario configurar a variavel ENVIAR_PRECO com a expressao cron. ")
        }



            try {

               

                let verifiIntegrationConfig = await configuracoesIntegration.select();
                if (!verifiIntegrationConfig.length) {
                    return console.log("integração nao esta configurada corretamente. verificar tabela [configuracoes]")
                }

                let { enviar_preco, tabela_preco, ultimo_envio_preco } = verifiIntegrationConfig[0];


                if (tabela_preco > 0) tabela = tabela_preco;

                if (enviar_preco === 'N') {
                    return console.log("integração nao esta configurada para enviar preco")
                }



                
        const sucessos: string[] = [];
        const erros: any[] = [];

                const database = `\`${database_api}\``;

                const sql = `	SELECT  
					 p.codigo 
				 
					  FROM mesquita_publico.cad_prod p
                 JOIN ${database}.variantes v on v.erp_sku = p.CODIGO 
                  join mesquita_publico.prod_tabprecos pp  on pp.PRODUTO = p.CODIGO 
 
								WHERE 
							p.ATIVO='S' AND p.NO_SITE = 'S'
							 and pp.PROMOCAO  >  0 AND    pp.VALID_PROM < NOW() 
							and pp.tabela = 3
							 
							GROUP BY p.CODIGO
                            limit 3
							;`

                    const [arrProductInShopify] = await conn2.query(sql)  

                    const productInShopify = arrProductInShopify as [ {  codigo:number }]

          const resultIndiceErp = await companyRepository.findIndiceErpParams();
            const {  INDICE } = resultIndiceErp[0];

                console.log(`[V] processando ${productInShopify.length} produtos... `)
                      
                        for(const product of productInShopify ){
                            


                              const resultPriceProduct = await erpPriceRepository.findPriceErpProduct(Number(product.codigo), tabela);
                              const { DATA_RECAD, PRECO , PROMOCAO, INDEXADO, VALID_PROM } = resultPriceProduct[0];
                
                                  const isPromotion = verifyDatePromotion.verify(currentDate,  VALID_PROM );


                                let productPrice = PRECO;
                                let productPromotion = PROMOCAO > 0 && isPromotion ? PROMOCAO : 0;

                              if( INDEXADO === 'S' )  productPrice =   PRECO * INDICE; 
                                 if(  INDEXADO === 'S' )  productPromotion = isPromotion ? ( PROMOCAO * INDICE) : 0 ;  


                              const resultVariant = await varianteIntegration.selectBySkuErp(Number(product.codigo));
                                const { variante_id, id_produto_pai } =resultVariant[0];
                                
                                const resultPriceErpProduct = await erpPriceRepository.findPriceErpProduct(product.codigo,tabela );

                           await delay(250);

                                if(resultPriceErpProduct.length > 0 ){

                                const resultService = await updatePrecoService.post(
                                        {
                                            price: productPrice,
                                            promotion: productPromotion,
                                            variantId: variante_id,
                                            productId: id_produto_pai,
                                            data_promocao: VALID_PROM
                                        }, Number(product.codigo), DATA_RECAD);
                                  if (resultService?.sucess) {
                                    console.log(`[V] ${Number(product.codigo)} Atualizado.`)
                                    sucessos.push(String(product.codigo));
                                } else {
                                    erros.push({ codigo:  String(product.codigo) , err: resultService?.message });
                                }
                              }
                            }
                           


            } catch (e) {
                console.error(`Erro controller preço  `, e)
         
            } finally { 
            }
                console.log("[V] Fim da tarefa." )

    }


  

}

