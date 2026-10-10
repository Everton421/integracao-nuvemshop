import mysql from 'mysql2/promise';

export type typeCompleteProduct = {
                CODIGO: number,
                CUSTO_MEDIO: number 
                ULT_CUSTO: number ,
                LARGURA: number,
                PESO: number,
                GARANTIA: number,
                COMPRIMENTO: number,
                ALTURA: number,

                PRECO?:string
                PROMOCAO?:string
                VALID_PROM?:string,

                DATA_RECAD:string,
                DESCR_CURTA_SITE:string,
                DESCR_LONGA_SITE:string,
                APLICACAO_SITE:string,
                TITULO_SITE:string,
                ORIGEM:string,
                NUM_FABRICANTE:string,
                MARCA:string,
                SUBCATEGORIA:string,
                CODIGO_SUBCATEGORIA:number
                CODIGO_CATEGORIA:number
                CATEGORIA:string,
                NO_SITE:"S" | "N",
                ATIVO:"S" | "N",
          
}


type resultQueryProductsForShipping  = {
        CODIGO_ERP:number
        DATA_RECAD:string
        DATA_ULTIMO_ENVIO: string | null 
       id:number | null
       id_produto_nuvemshop: number | null,
       id_variante_nuvemshop: number | null
}
type typeStockProduct = { 
  CODIGO:number,
  ESTOQUE:number
}
export class ProductErpRepository {

    private databasePublico:string ; 
    private connection: mysql.Pool;
    private databaseIntegration: string;
    private databaseEstoque:string
    private databaseVendas:string

    constructor( connection:mysql.Pool, databasePublico:string, databaseIntegration: string, databaseEstoque:string, databaseVendas:string){
        this.connection = connection
        this.databasePublico= databasePublico
        this.databaseIntegration = databaseIntegration
        this.databaseEstoque=databaseEstoque
        this.databaseVendas=databaseVendas;
    }
 

  /**
   * Retorna dados de um produto.
   * @param codeProduct Código do produto no ERP.
   * @param ativo   Ativo 'S' = sim, 'N' = Inativo. Default( 'S' ).
   * @param priceTable Código da tabela de preços ( OPCIONAL)
   * @returns 
   */
  async findSingleCompleteErpProduct(codeProduct: number, ativo: 'S' | 'N'= 'S' , priceTable?: number ): Promise<typeCompleteProduct[]> {


    let baseSql = `SELECT
                p.CODIGO,
                coalesce(DATE_FORMAT(p.DATA_RECAD, '%Y-%m-%d %H:%i:%s') ,'0000-00-00 00:00:00') AS DATA_RECAD,
                p.DESCR_CURTA_SITE,
                p.DESCR_LONGA_SITE,
                p.APLICACAO_SITE,
                p.TITULO_SITE,
                p.GARANTIA,
                p.COMPRIMENTO,
                p.LARGURA,
                p.ALTURA,
                p.PESO,
                p.ORIGEM,
                p.NO_SITE,
                p.ATIVO,
                p.NUM_FABRICANTE,
                m.descricao AS MARCA,
                sg.CODIGO as CODIGO_SUBCATEGORIA,
                sg.DESCRICAO AS SUBCATEGORIA,
                cg.NOME AS CATEGORIA,
                cg.CODIGO as CODIGO_CATEGORIA,
                pc.ULT_CUSTO ,
                pc.CUSTO_MEDIO  `
          
      let middleOfSql = `
                     FROM ${this.databasePublico}.cad_prod p
                    LEFT JOIN ${this.databasePublico}.cad_pmar m ON m.codigo = p.marca
                    LEFT JOIN ${this.databasePublico}.cad_pgru cg ON cg.CODIGO = p.GRUPO
                    LEFT JOIN ${this.databasePublico}.subgrupos sg ON sg.CODIGO = p.SUBGRUPO  AND cg.CODIGO = sg.COD_GRUPO
                    LEFT JOIN ${this.databasePublico}.prod_custos pc on (pc.PRODUTO = p.CODIGO) AND (pc.FILIAL = 2)
              `

    const conditions = []
    const values = []

    const whereClause = " WHERE  ";
    const groupBy = '  GROUP BY p.CODIGO ORDER BY p.CODIGO;';

    if (priceTable) {
      baseSql += `,coalesce(tp.PRECO, 0 ) PRECO,
                coalesce(tp.PROMOCAO, 0) PROMOCAO ,
                DATE_FORMAT(tp.VALID_PROM, '%Y-%m-%d') as VALID_PROM` 
      middleOfSql += ` LEFT JOIN ${this.databasePublico}.prod_tabprecos tp ON p.CODIGO = tp.PRODUTO  and tp.tabela = ${priceTable} `;
    } else {
      middleOfSql += ` LEFT JOIN ${this.databasePublico}.prod_tabprecos tp ON p.CODIGO = tp.PRODUTO  `;
    }

    if(ativo){
    conditions.push(' p.ATIVO = ? ');
    values.push('S');
    }

    conditions.push(' p.CODIGO = ? ');
    values.push(codeProduct);

    conditions.push(`    cg.NO_SITE = ? AND sg.NO_SITE = ? `)
    values.push(  'S', 'S');

    const finalSql = baseSql + middleOfSql + whereClause + conditions.join(' AND ') + groupBy;
    const [rows] = await this.connection.query(finalSql, values) as any;

    return rows;
  }

  /**
   * Traz informações de produtos que precisam de update na nuvemshop.
   * @param isUpdate determina se deve ser comparado a data de ultimo envio com a data de atualização do sistema.
   * @returns 
   */
  async findProductsForShipping(isUpdate:boolean = true): Promise<resultQueryProductsForShipping[]>{

  let baseSql = `
    SELECT 	
      cp.CODIGO as CODIGO_ERP,
      cp.DATA_RECAD as DATA_RECAD,
      ip.updated_at as DATA_ULTIMO_ENVIO,
      ip.id,
      ip.id_produto_nuvemshop,
      ip.id_variante_nuvemshop
    FROM 
      ${this.databasePublico}.cad_prod cp
     left join ${this.databaseIntegration}.produtos ip on ip.codigo_erp = cp.CODIGO
    WHERE ATIVO ='S' AND NO_SITE='S'  AND cp.codigo  < 1000
    `;
    if(isUpdate){
      baseSql += ` AND  ( cp.DATA_RECAD > ip.ultimo_envio_produto OR ip.id is null ) `;
    }
    const [rows] = await this.connection.query(baseSql );
    return rows as resultQueryProductsForShipping[];
  }

    
  async findStock(product?:number):Promise<typeStockProduct[]>{
   let sql= `SELECT
                    P.CODIGO,
                    GREATEST(COALESCE(EST.ESTOQUE_TOTAL, 0) - COALESCE(RES.RESERVADO, 0), 0) AS ESTOQUE
                FROM ${this.databasePublico}.cad_prod P
                LEFT JOIN (
                    SELECT
                        PS.PRODUTO,
                        MAX(PS.DATA_RECAD) AS DATA_RECAD,
                        SUM(PS.ESTOQUE) AS ESTOQUE_TOTAL
                    FROM ${this.databaseEstoque}.prod_setor PS
                    WHERE PS.SETOR IN (
                        -- Usando DISTINCT para evitar duplicar linhas caso o setor esteja em mais de uma empresa
                        SELECT DISTINCT S.SETOR
                        FROM ${this.databaseVendas}.empresas_setor S
                        WHERE S.EST_ATUAL = 'X'   AND  S.EST_REAL = 'X' 
                    )
                    GROUP BY PS.PRODUTO
                ) EST ON EST.PRODUTO = P.CODIGO

                -- 2. Subconsulta de RESERVAS em orçamentos pendentes
                LEFT JOIN (
                    SELECT
                        PO.PRODUTO,
                            SUM(
												LEAST(PO.QTDE_SEPARADA, GREATEST(PO.QUANTIDADE - PO.QTDE_MOV, 0))
												* PO.FATOR_QTDE
												* IF(CO.TIPO = '5', -1, 1)
										) AS RESERVADO
                    FROM ${this.databaseVendas}.cad_orca CO
                    INNER JOIN ${this.databaseVendas}.pro_orca PO ON PO.ORCAMENTO = CO.CODIGO
                    WHERE CO.SITUACAO IN ('AI','AP','FP')
                    GROUP BY PO.PRODUTO
                ) RES ON RES.PRODUTO = P.CODIGO

                WHERE P.ATIVO = 'S' 
            `

          if(product){
            sql += ` AND P.CODIGO = ${product}` 
          }

    const [rows] = await this.connection.query(sql );
    return rows as typeStockProduct[];
  }
 
  async acquireLock(sku: number, timeout = 30): Promise<boolean> {
    const [rows]: any = await this.connection.query(
      `SELECT GET_LOCK(?, ?) as result`,
      [`sync_produto_${sku}`, timeout]
    );
    return rows[0]?.result === 1;
  }

  async releaseLock(sku: number): Promise<boolean> {
    const [rows]: any = await this.connection.query(
      `SELECT RELEASE_LOCK(?) as result`,
      [`sync_produto_${sku}`]
    );
    return rows[0]?.result === 1;
  }
 
}