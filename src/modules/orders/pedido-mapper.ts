import { type cad_orca } from "../../shared/interfaces/cad_orca.ts";
import { type pro_orca } from "../../shared/interfaces/pro-orca.ts";
import { DateService } from "../../shared/utils/date-service.ts";
import { LogsIntegration } from "../logs/log-integration.ts";
import { VarianteIntegration } from "../products/repository/variants-integration.ts";
import { type requestOrder } from "./get-order-request.ts";


/**
 *
 * @param pedidoRequest  Objeto do pedido vindo da shopify
 * @param codigo_cliente codigo do cliente no sistema.
 * @param total_geral total do pedido descontos + frete
 * @param total_produtos_sem_desconto total dos produtos sem desconto.
 * @param quantidade_parcelas quantidade de parcelas.
 * @param vendedor codigo do vendedor.
 * @param transportadora codigo da transportadora.
 * @param forma_pagamento codigo da forma de pagamento no ERP (padrão 12 = A VISTA)
 * @returns
 */
export function cad_orca_mapper(pedidoRequest: requestOrder, codigo_cliente: number, total_geral: number, total_produtos_sem_desconto: number, quantidade_parcelas: number,
   vendedor: number, shopifyFulfillmentOrderId: string,   transportadora?:number, forma_pagamento: number = 12,  total_desconto?: number ) {

  const dateService = new DateService();
  const items = pedidoRequest.lineItems.nodes;

  const descontosPorItem = items.reduce((acc, i) => {
    if (i.currentQuantity === 0) return acc;
    return acc + (Number(i.currentQuantity) * Number(i.originalUnitPriceSet.shopMoney.amount) - Number(i.discountedTotalSet.shopMoney.amount));
  }, 0);

  const descontos = total_desconto !== undefined ? Math.max(total_desconto, descontosPorItem) : descontosPorItem;

  let situacao = 'AI';
  
  let shippingValueCIF = 0 ;
  
  // valor do frete com aplicação de algum desconto.
  let ShippingdiscountedPriceSet = pedidoRequest.shippingLines?.nodes[0].discountedPriceSet.shopMoney.amount || 0 ;

  // valor do frete sem aplicacao de algun desconto.
  let ShippingOriginalPriceSet = pedidoRequest.shippingLines?.nodes[0].originalPriceSet.shopMoney.amount || 0;



  // valida se foi feita aplicação de algun desconto no frete para aplocar o valor que a loja deve pagar
  // no frete CIF 
  if( Number(ShippingdiscountedPriceSet) == 0 && Number(ShippingOriginalPriceSet) > 0  ){
    shippingValueCIF = Number(ShippingOriginalPriceSet);
  }

  if(pedidoRequest.cancelledAt){
    situacao = 'RE'
  }

  const cad_orca = {
    STATUS: 0,
    CLIENTE: codigo_cliente,
    TOTAL_PRODUTOS: Number(total_produtos_sem_desconto),
    DESC_PROD: descontos,
    TOTAL_GERAL: total_geral,
    DATA_PEDIDO: dateService.formatarDataHora(pedidoRequest.createdAt),
    VALOR_FRETE: Number(pedidoRequest.currentShippingPriceSet.shopMoney.amount),
    SITUACAO: situacao,
    DATA_CADASTRO: dateService.obterDataAtual(),
    HORA_CADASTRO: dateService.obterHoraAtual(),
    DATA_INICIO: dateService.obterDataHoraAtual(),
    HORA_INICIO: dateService.obterHoraAtual(),
    VENDEDOR: vendedor,
    CONTATO: `SITE - ${pedidoRequest.name}`,
    OBSERVACOES: pedidoRequest.note || '',
    OBSERVACOES2: '',
    TIPO: 2,
    NF_ENT_OS: '',
    RECEPTOR: '',
    VAL_PROD_MANIP: total_produtos_sem_desconto,
    PERC_PROD_MANIP: 100,
    PERC_SERV_MANIP: 0,
    REVISAO_COMPLETA: '',
    DESTACAR: '',
    TABELA: 'P',
    QTDE_PARCELAS: quantidade_parcelas,
    ALIQ_ISSQN: 0,
    OUTRAS_DESPESAS: 0,
    PESO_LIQUIDO: 0,
    BASE_ICMS_UF_DEST: 0,
    FORMA_PAGAMENTO: forma_pagamento,
    TRANSPORTADORA: transportadora || 0,
    FRETE: 'C' , // fixo como CIF 
    QUANTIDADE:1,
    MIDIA:10,
    VALOR_FRETE_CIF: shippingValueCIF,
    FULLFILMENT_ORDER_ID: shopifyFulfillmentOrderId
  } as cad_orca

  return cad_orca as cad_orca;
}

/**
 * 
 * @param pedidoRequest Objeto do pedido vindo da shopify.
 * @param num_pedido numero do pedido, campo [ ORCAMENTO: num_pedido ] tabela cad_orca determina o pedido que o produto pertence.
 * @param tabela codigo tabela de preco.
 * @param total_produtos_sem_desconto total dos produtos com desconto. 
 * @returns 
 */
export async function pro_orca_mapper(pedidoRequest: requestOrder, num_pedido: number, tabela: number, total_produtos_sem_desconto: number, total_desconto: number = 0) {

  const items = pedidoRequest.lineItems.nodes

  const varianteIntegration = new VarianteIntegration();
  const logIntegration = new LogsIntegration();


  const arrItems: pro_orca[] = []

  const valorTotalFrete = Number(pedidoRequest.currentShippingPriceSet.shopMoney.amount)

  let count = 1;

  for (const i of items) {
    if (i.currentQuantity === 0) {
      continue;
    }

    if(!i.variant){
      console.log(` Produto do pedido ${pedidoRequest.name}   não possui vinculo com o sistema`)
      await logIntegration.insert({ action: '', dados_shopify: String(JSON.stringify(i)), message: ` Produto do pedido ${pedidoRequest.name}   não possui vinculo com o sistema. `, referencia: 'order', referencia_id: 0, status: 'error' })
      continue;
    }

    const locaiId = i.variant.inventoryItem.inventoryLevels.edges[0]?.node.location.id || "gid://shopify/Location/80062283942";
    let erp_sku: number;
    let CUSTO_MEDIO = 0;
    let ULT_CUSTO = 0;
    let SIGLA = 'UND';
    let arrVariant = await varianteIntegration.selectCostsByVariantId(String(i.variant.id), locaiId);

    

    if (arrVariant.length > 0) {
      erp_sku = Number(arrVariant[0].erp_sku)

      CUSTO_MEDIO = arrVariant[0].CUSTO_MEDIO || 0;
      ULT_CUSTO = arrVariant[0].ULT_CUSTO || 0;
      SIGLA = arrVariant[0].SIGLA || 'UND';
    } else {

      console.log(`O produto ID:${i.variant.id} | ${i.name} não possui vinculo com o sistema.`)
      await logIntegration.insert({ action: '', dados_shopify: String(JSON.stringify(i)), message: `O produto ID: ${i.variant.id} | ${i.name} não possui vinculo com o sistema. pedido ${pedidoRequest.name}`, referencia: 'order', referencia_id: 0, status: 'error' })
      continue;
    }

    const valorTotalProduto: number = Number(i.currentQuantity) * Number(i.originalUnitPriceSet.shopMoney.amount);
    const fator: number = valorTotalProduto / total_produtos_sem_desconto;
    const freteItem = Number(fator) * Number(valorTotalFrete);


    const descontoProporcional = total_desconto > 0
        ? total_desconto * (valorTotalProduto / total_produtos_sem_desconto)
        : 0;
    const desconto = (valorTotalProduto - Number(i.discountedTotalSet.shopMoney.amount)) + descontoProporcional;
    arrItems.push({
      ORCAMENTO: num_pedido,
      SEQUENCIA: count,
      PRODUTO: Number(erp_sku),
      GRADE: 0,
      PADRONIZADO: 0,
      COMPLEMENTO: '',
      TABELA: tabela,
      PRECO_TABELA: Number(i.originalUnitPriceSet.shopMoney.amount),
      UNIDADE: SIGLA,
      ITEM_UNID: 1,
      JUST_IPI: '',
      JUST_ICMS: '',
      JUST_SUBST: '',
      QUANTIDADE: Number(i.currentQuantity),
      UNITARIO: Number(i.originalUnitPriceSet.shopMoney.amount),
      TOTAL_LIQ: Number(i.discountedTotalSet.shopMoney.amount),
      UNIT_ORIG: Number(i.originalUnitPriceSet.shopMoney.amount),
      CUSTO_MEDIO: CUSTO_MEDIO,
      ULT_CUSTO: ULT_CUSTO,
      FRETE: freteItem,
      IPI: 0,
      DESCONTO: desconto
    })
    count = count + 1
  }

  return arrItems;

}





