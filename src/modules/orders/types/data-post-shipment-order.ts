 
export type DADOS_PEDIDO_INTELIPOST = {
  shopifyFulfillmentOrderId: string // NUMERO DO PEDIDO VINDO DA SHOPIFY, REFERENTE A COTAÇÃO FEITA PELO CLIENTE
  SHOPIFY_ORDER_NAME: string // nome do pedido da shopify
  FRETE: number
  METODO_DE_ENTREGA: number //Método de entrega utilizado no pedido de envio 
  TOTAL_NF: number
  NUMERO_NF: string
  CHAVE_NFE: string
  DATA_EMISSAO: string
  CEP_ORIGEM: string
  ENDERECO_FILIAL: string,
  NUMERO_ENDERECO_FILIAL: string,
  BAIRRO_FILIAL: string
  CIDADE_FILIAL: string,
  COMPLEMENTO_FILIAL: string,
  ESTADO_FILIAL: string,
  NOME_FILIAL: string
  CNPJ_FILIAL: string
  CFOP:string,
   PROTOCOLO_NFE:string 
    SERIE_NF:string 
     TOTAL_PRODUTOS:number

}

export type PRODUTO_PEDIDO = {
          NOME_PRODUTO: string,
          QUANTIDADE: number,
          VALOR_UNITARIO: number
}

export type InvoiceItem = {
  item_number: number
  item_description: string
  item_quantity: number
  item_value: number
  item_weight: number
}

export type VOLUMES_PEDIDO_INTELIPOST =
  {
    PESO: number
    TIPO_VOLUME: "ENVELOPE" | "BOX" | "BAG" | "TUBE" | "PALLET" | string
       LARGURA :number,
       ALTURA :number,
       COMPRIMENTO :number,
       QUANTIDADE: number
    products_nature?: string
    products_quantity?: number
    is_icms_exempt?: boolean
    invoice_items?: InvoiceItem[]
  }


export type CLIENTE_PEDIDO_INTELIPOST = {
  NOME: string,
  CIDADE: string, //Cidade de destino do pedido
  ENDERECO: string, //Endereço do cliente
  NUMERO: string, //Número do endereço do cliente
  BAIRRO: string,
  CPF:string
  CEP: string,
  COMPLEMENTO: string,
  TELEFONE_RES: string,
  EMAIL: string,
  PAIS: 'Brasil' | string, // Adicionado pois costuma ser obrigatório
  ESTADO: string // Ideal que o data também traga o estado
  CELULAR: string
}

export type numerosPedidosExterno = {
  marketplace?: string,
  sales?: string,
  plataforma?: string,
  erp?: string
}
