import { type cad_orca } from "../../shared/interfaces/cad_orca.ts";
import { type par_orca } from "../../shared/interfaces/par_orca.ts";
import { type pro_orca } from "../../shared/interfaces/pro-orca.ts";
import { DateService } from "../../shared/utils/date-service.ts";
import {type NuvemshopOrderPaymentStatus, type NuvemshopOrderStatus, type NuvemshopOrder } from "./types/types-order-request.ts";

export class OrderMapper {
    private dateService: DateService;

    constructor(dateService: DateService) {
        this.dateService = dateService;
    }

    orderMapp(nuvemshopOrder: NuvemshopOrder, erpCustomerCode: number, seller: number) {

        const {
            total, // tatal com os descontos.
            subtotal, // Total sem descontos.
            discount,
            created_at, // data de criacao do pedido.
            updated_at, // data de ultima atualização do pedido.
            payment_details,
            number, // numero da venda na nuvenshop.
            id
        } = nuvemshopOrder

        const situation = this.switchSituation( nuvemshopOrder.payment_status, nuvemshopOrder.status);

        const quantityInstallments = payment_details.installments;

        const cad_orca: cad_orca = {
            COD_SITE: String(id),
            STATUS: 0,
            CLIENTE: erpCustomerCode,
            TOTAL_PRODUTOS: Number(subtotal),
            DESC_PROD: Number(discount),
            TOTAL_GERAL: Number(total),
            DATA_PEDIDO: this.dateService.formatarDataHora(created_at),
            DATA_RECAD: this.dateService.formatarDataHora(updated_at),
            VALOR_FRETE: 0,
            SITUACAO: situation,
            DATA_CADASTRO: this.dateService.obterDataAtual(),
            HORA_CADASTRO: this.dateService.obterHoraAtual(),
            DATA_INICIO: this.dateService.obterDataHoraAtual(),
            HORA_INICIO: this.dateService.obterHoraAtual(),
            VENDEDOR: seller,
            CONTATO: `SITE - #${number}`,
            OBSERVACOES: '',
            OBSERVACOES2: '',
            TIPO: 2,
            NF_ENT_OS: '',
            RECEPTOR: '',
            VAL_PROD_MANIP: subtotal,
            PERC_PROD_MANIP: 100,
            PERC_SERV_MANIP: 0,
            REVISAO_COMPLETA: '',
            DESTACAR: '',
            TABELA: 'P',
            QTDE_PARCELAS: quantityInstallments,
            ALIQ_ISSQN: 0,
            OUTRAS_DESPESAS: 0,
            PESO_LIQUIDO: 0,
            BASE_ICMS_UF_DEST: 0,
            FORMA_PAGAMENTO: 0,
            TRANSPORTADORA: 0,
            FRETE: 'C', // fixo como CIF 
            QUANTIDADE: 1,
            VALOR_FRETE_CIF: 0,
            MIDIA: 0
        }
        return cad_orca
    }

    itensOrderMapp(nuvemshopOrder: NuvemshopOrder, erpOrderCode: number, priceTable: number) {
        const products = nuvemshopOrder.products;
        const pro_orca: pro_orca[] = [];
        const discountOrder = Number( nuvemshopOrder.discount );

        const quantityItens = products.length;

        //  % de desconto do pedido :  ( descontos / total do pedido (SEM DESCONTO) ) * 100 
        const orderDiscountPercentage = ( discountOrder / Number(nuvemshopOrder.subtotal));

            let sumDiscountItens = 0;
             
            for (const [index, product] of products.entries()) {

            // desconto nos produtos : valor total do produto *  % de desconto do pedido 
                const totalLiq=Number(product.quantity) * Number(product.price);
                
                const itemDiscount= totalLiq * orderDiscountPercentage;

                let sequencia = index == 0 ? 1 : index;
                pro_orca.push({
                    ORCAMENTO: erpOrderCode,
                    SEQUENCIA: sequencia,
                    PRODUTO: Number(product.sku),
                    GRADE: 0,
                    PADRONIZADO: 0,
                    TABELA: 0,
                    PRECO_TABELA: priceTable,
                    COMPLEMENTO: '',
                    UNIDADE: 'UND',
                    ITEM_UNID: 1,
                    JUST_IPI: '',
                    JUST_ICMS: '',
                    JUST_SUBST: '',
                    QUANTIDADE: Number(product.quantity),
                    UNITARIO: Number(product.price),
                    TOTAL_LIQ: Number(product.quantity) * Number(product.price),
                    UNIT_ORIG: Number(product.price),
                    CUSTO_MEDIO: 0,
                    ULT_CUSTO: 0,
                    FRETE: 0,
                    IPI: 0,
                    DESCONTO: itemDiscount
                })
                sumDiscountItens += itemDiscount;
                sequencia++;
            }

            const difference = discountOrder - sumDiscountItens;

            if(sumDiscountItens != 0 ){
                 pro_orca[quantityItens - 1 ].DESCONTO += difference;
            }

        return pro_orca;
    }

    installmentsOrderMapp(nuvemshopOrder: NuvemshopOrder, erpOrderCode: number) {

        const installments: par_orca[] = []
        const quantityInstallments = nuvemshopOrder.payment_details.installments;

        for (let i = 1; i <= quantityInstallments; i++) {
            installments.push({
                orcamento: erpOrderCode,
                parcela: i,
                tipo_receb: 0,
                valor: Number(nuvemshopOrder.total),
                vencimento: this.dateService.obterDataHoraAtual()
            })
        }
        return installments;
    }


   switchSituation( paymentStatus: NuvemshopOrderPaymentStatus, status: NuvemshopOrderStatus){
                if(paymentStatus == 'refunded' || paymentStatus == 'voided' || paymentStatus == 'partially_refunded' || paymentStatus == 'abandoned' || status == 'cancelled'){
                    return 'RE';
                }
                if(paymentStatus == 'pending' || paymentStatus == 'partially_paid' && status == 'open'){
                    return 'EA'
                }
                if(paymentStatus == 'paid' && status == 'open'){
                    return 'AI'
                }
                return  null
        }
}
