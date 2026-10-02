import { conn2,  db_publico } from "../../../database/database-connection.ts";

type prodPreco = {
  PRECO: number, 
  PROMOCAO:number,
  VALOR_PROMOCAO:number
  PRODUTO: number, TABELA: number, DATA_RECAD: string,
  INDEXADO: 'S' | 'N', VALID_PROM:string
}

export class ErpPriceRepository{


    async findPriceTables(): Promise<[{ CODIGO: number, FILIAL: number, DESCRICAO: String, PADRAO: 'S' | 'N' }]> {

    const sql = ` SELECT * FROM ${db_publico}.tab_precos ORDER BY CODIGO DESC ;
                          `
    const [rows] = await conn2.query(sql)
    return rows as any;
  }

  /**
   *   obtem o preço de um produto com base na data de ultima alteração.
   * @param codeProduct 
   * @param data_recad 
   * @param codTable 
   * @returns 
   */
  async findPriceErpProductUpdateAt(codeProduct: number, data_recad: string, codTable?: number): Promise<prodPreco[]> {

    const baseSql = ` SELECT pp.PRECO,
                 DATE_FORMAT(pp.VALID_PROM, '%Y-%m-%d') as VALID_PROM,
           pp.PRODUTO,
            if(now() > pp.VALID_PROM , 0 , pp.PROMOCAO) as PROMOCAO,
            pp.TABELA, pp.DATA_RECAD , pc.INDEXADO
                  from ${db_publico}.prod_tabprecos pp
                  join ${db_publico}.tab_precos tp on tp.codigo = pp.tabela 
                  LEFT JOIN ${db_publico}.prod_custos pc  on (pc.PRODUTO = pp.PRODUTO) AND (pc.FILIAL = 2)
                  
                  where  
                 `
    const conditions = []
    const values: any[] = []

    conditions.push(' pp.PRODUTO = ? ');
    values.push(codeProduct);

    conditions.push(' pp.DATA_RECAD > ? ');
    values.push(data_recad)

    if (codTable) {
      conditions.push(' tp.CODIGO = ? ');
      values.push(codTable);
    }
    const sql = baseSql + conditions.join(' AND ');
    const [rows] = await conn2.query(sql, values)
    return rows as any;
  }

 /** 
   * 
   * @param codeProduct codigo do produto
   * @param codTable codigo da tabela
   * @returns 
   */
  async findPriceErpProduct(codeProduct: number, codTable?: number): Promise<prodPreco[]> {

    const baseSql = ` SELECT pp.PRECO, 
                     DATE_FORMAT(pp.VALID_PROM, '%Y-%m-%d') as VALID_PROM,
                     if(now() > pp.VALID_PROM , 0 , pp.PROMOCAO) as PROMOCAO,
                    pp.PRODUTO, pp.TABELA, pp.DATA_RECAD, pc.INDEXADO
             from ${db_publico}.prod_tabprecos pp
                  JOIN ${db_publico}.tab_precos tp on tp.codigo = pp.tabela 
                  LEFT JOIN ${db_publico}.prod_custos pc  on (pc.PRODUTO = pp.PRODUTO) AND (pc.FILIAL = 2)
                  where  
                 `
    const conditions = []
    const values: any[] = []

    conditions.push(' pp.PRODUTO = ? ');
    values.push(codeProduct);

    if (codTable) {
      conditions.push(' tp.CODIGO = ? ');
      values.push(codTable);
    }
    const sql = baseSql + conditions.join(' AND ');

    const [rows] = await conn2.query(sql, values)
    return rows as any
  }

    
}