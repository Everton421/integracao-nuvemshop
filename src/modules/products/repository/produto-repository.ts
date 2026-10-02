import {type cad_pgru } from "../../../shared/interfaces/cad_pgru.ts";
import { type ICompleteProduct, type IProductSystem } from "../../../shared/interfaces/cad_prod.ts";
import {type subgrupos } from "../../../shared/interfaces/subgrupos.ts";

 import mysql from 'mysql2/promise';

type resultCodeProduct = {
  codigo: number
}
 
type resultIsDisabledProductSite = {
  CODIGO: number
  id_produto_pai: string
  PRODUTO_NO_SITE: 'S' | 'N' | null
  variante_id: string
  SUBGRUPO_NO_SITE: 'S' | 'N' | null
  GRUPO_NO_SITE: 'S' | 'N' | null
}

export class ProductErpRepository {

        private database_api:string;
        private conn2:mysql.Pool
        private db_estoque:string  
        private db_publico:string   
        private db_vendas:string
      constructor(     
          conn2:mysql.Pool,
          database_api:string,
          db_estoque:string,  
          db_publico:string,  
          db_vendas:string
        ){
        this.conn2= conn2 
        this.database_api= database_api 
        this.db_estoque= db_estoque 
        this.db_publico= db_publico 
        this.db_vendas= db_vendas 
      }


 /*

async findGroupErp(){
    const [ result ] =await conn2.query(`SELECT * FROM ${db_publico}.cad_pgru WHERE ATIVO = 'S' AND NO_SITE = 'S' ORDER BY CODIGO ; `)
    return result  as cad_pgru[]
}
async findSubGroupErp(){
    const [ result ] =await conn2.query(`SELECT * FROM ${db_publico}.subgrupos WHERE     NO_SITE = 'S' ORDER BY CODIGO; `)
    return result  as subgrupos[]
}
  /**
   *  retorna uma lista com os codigos dos produtos do erp com base na query
   * @param query = syncStatus, updated_at, codigo, limit, offset , priceTable  
   * @returns 
   */
async findCodeProductErpUpdatedAt(query: {
    updated_at?: string,
    syncStatus?: 'not_synced' | 'synced',
    codigo?: number,
    limit?: number,
    offset?: number,
    priceTable?: number }) {
        const { syncStatus, updated_at, codigo, limit, offset , priceTable} = query;

        let sql = `select p.codigo 
                    FROM ${this.db_publico}.cad_prod p
                          JOIN ${db_publico}.cad_pgru cg ON cg.CODIGO = p.GRUPO
                        LEFT JOIN ${db_publico}.subgrupos sg ON sg.CODIGO = p.SUBGRUPO
                      LEFT JOIN ${this.database_api}.variantes v on v.erp_sku = p.CODIGO 
                      `;


        let whereClause = " WHERE  p.ATIVO='S'    AND cg.NO_SITE = 'S' AND sg.NO_SITE = 'S'  ";

        if (priceTable && priceTable > 0) {
          sql += ` LEFT JOIN ${db_publico}.prod_tabprecos tp ON p.CODIGO = tp.PRODUTO `;
          whereClause +=`  AND tp.tabela = ${priceTable} `; 
        }

        if (syncStatus === 'not_synced') {
          whereClause += " AND v.id_produto_pai IS NULL ";
        } else if (syncStatus === 'synced') {
          whereClause += " AND v.id_produto_pai IS NOT NULL ";
        }

        const values = []
        if (updated_at) {
          whereClause += "  AND p.DATA_RECAD > ?";
          values.push(updated_at);
        }
        if (codigo && codigo > 0) {
          whereClause += "  AND p.CODIGO  = ?";
          values.push(codigo)
        }


        // Adicionando ordenação consistente para a paginação não repetir itens
        let finalSql = sql + whereClause + " ORDER BY p.codigo ASC ";

        if (limit !== undefined && offset !== undefined) {
          finalSql += " LIMIT ? OFFSET ? ";
          values.push(limit, offset);
        }
        const [arrResult] = await conn2.query(finalSql, values);

        return arrResult as resultCodeProduct[];
  }


/**
 *  retorna a quantidade de produtos no erp com base na consulta. 
 * @param query priceTable?: number, search?: string, syncStatus?: string
 * @returns total: number
 */
  async countTotalProductsErp(query: { priceTable?: number, search?: string, syncStatus?: string , ativo?:'S' | 'N'} ): Promise<number> {
    const { priceTable, search, syncStatus,ativo } = query;

    let sql = `
            SELECT COUNT(DISTINCT p.CODIGO) as total
            FROM ${db_publico}.cad_prod p
                 JOIN ${db_publico}.cad_pgru cg ON cg.CODIGO = p.GRUPO
            LEFT JOIN ${db_publico}.subgrupos sg ON sg.CODIGO = p.SUBGRUPO

            LEFT JOIN ${this.database_api}.variantes v on v.erp_sku = p.CODIGO 

        `;
    let whereClause = " WHERE  cg.NO_SITE = 'S' AND sg.NO_SITE = 'S'";
    const values = [];

    if(ativo){
      whereClause+=` AND  p.ATIVO = '${ativo}' `
    }

    if (priceTable) {
      sql += ` LEFT JOIN ${db_publico}.prod_tabprecos tp ON p.CODIGO = tp.PRODUTO AND tp.tabela = ${priceTable} `;
    }

    if (search) {
      whereClause += ` AND (p.CODIGO LIKE ? OR p.DESCRICAO LIKE ? OR p.SKU_MKTPLACE LIKE ?) `;
      const term = `%${search}%`;
      values.push(term, term, term);
    }

    if (syncStatus === 'not_synced') {
      whereClause += " AND v.id_produto_pai IS NULL ";
    } else if (syncStatus === 'synced') {
      whereClause += " AND v.id_produto_pai IS NOT NULL ";
    }

    const finalSql = sql + whereClause
   
    const [rows] = await conn2.query(finalSql, values) as any;

    return rows

  }

  /**
   * Obtem uma lista de produtos com os campos necessarios para enviar para shopify
   * @param query updated_at: string, priceTable: number, syncStatus?: 'not_synced' | 'synced'
   * @returns ICompleteProduct[]
   */
  async findCompleteProductErpUpdatedAt(query: { updated_at: string, priceTable: number, syncStatus?: 'not_synced' | 'synced' } ): Promise<ICompleteProduct[]> {
    const  { priceTable, updated_at, syncStatus    } = query;
    let baseSql = `SELECT
                p.CODIGO,
                p.OUTRO_COD,
                coalesce(DATE_FORMAT(p.DATA_RECAD, '%Y-%m-%d %H:%i:%s') ,'0000-00-00 00:00:00') AS DATA_RECAD,
                p.SKU_MKTPLACE,
                p.DESCR_CURTA_MKTPLACE,
                p.DESCR_LONGA_MKTPLACE,
                p.DESCR_CURTA_SITE,
                p.DESCR_LONGA_SITE,
                p.APLICACAO_SITE,
                p.TITULO_SITE,
                p.DESCRICAO,
                CAST(p.APLICACAO AS CHAR(10000) CHARACTER SET latin1) AS APLICACAO,
                p.GARANTIA,
                p.PESO,
                p.LARGURA,
                p.ALTURA,
                p.COMPRIMENTO,
                p.ORIGEM,
                p.NUM_FABRICANTE,
                p.NO_SITE,
                p.ATIVO,
                coalesce(tp.PRECO, 0 ) PRECO ,
                coalesce(tp.PROMOCAO, 0 ) PROMOCAO, 
                DATE_FORMAT(tp.VALID_PROM, '%Y-%m-%d') as VALID_PROM,
                m.descricao AS MARCA,
                sg.DESCRICAO AS SUBCATEGORIA,                
                cg.NOME AS CATEGORIA,
                pc.INDEXADO,
                v.id_produto_pai,
                v.variante_id
            FROM ${db_publico}.cad_prod p
              JOIN ${db_publico}.cad_pgru cg ON cg.CODIGO = p.GRUPO
            LEFT JOIN ${db_publico}.cad_pmar m ON m.codigo = p.marca
            LEFT JOIN ${db_publico}.class_fiscal cf ON cf.CODIGO = p.CLASS_FISCAL
            LEFT JOIN ${db_publico}.subgrupos sg ON sg.CODIGO = p.SUBGRUPO AND cg.CODIGO = sg.COD_GRUPO
            
            LEFT JOIN ${db_publico}.prod_custos pc on (pc.PRODUTO = p.CODIGO) AND (pc.FILIAL = 2)
            LEFT JOIN ${this.database_api}.variantes v on v.erp_sku = p.CODIGO 
           LEFT JOIN ${db_publico}.prod_tabprecos tp ON p.CODIGO = tp.PRODUTO and tp.tabela = ${priceTable} 
        `;


    const groupBy = " GROUP BY p.CODIGO  ORDER BY p.CODIGO ;";

    let whereClause = " where   cg.NO_SITE = 'S' AND sg.NO_SITE = 'S' ";
    const values = [];

    whereClause += " AND p.DATA_RECAD >  ? ";
    values.push(`${updated_at}`);

    if (syncStatus === 'not_synced') {
      whereClause += " AND v.id_produto_pai IS NULL ";
    } else if (syncStatus === 'synced') {
      whereClause += " AND v.id_produto_pai IS NOT NULL ";
    }
    const finalSql = baseSql + whereClause + groupBy;
    const [rows] = await conn2.query(finalSql, values) as any;
    return rows
  }
  
/**
 *  Retorna a quantidade de produtos encontrados no erp com base na consulta.
 * @param query syncStatus?: 'not_synced' | 'synced', updated_at?: string 
 * @returns total: number
 */
  async countProductsToSync(query: { syncStatus?: 'not_synced' | 'synced', updated_at?: string }) {
    const { syncStatus, updated_at } = query;
    let sql = `SELECT COUNT(p.codigo) as total 
               FROM ${db_publico}.cad_prod p
                  LEFT JOIN ${db_publico}.cad_pgru cg ON cg.CODIGO = p.GRUPO
                  LEFT JOIN ${db_publico}.subgrupos sg ON sg.CODIGO = p.SUBGRUPO
                  LEFT JOIN ${this.database_api}.variantes v on v.erp_sku = p.CODIGO 
               WHERE p.ATIVO='S'`;

    if (syncStatus === 'not_synced') sql += " AND v.id_produto_pai IS NULL ";
    else if (syncStatus === 'synced') sql += " AND v.id_produto_pai IS NOT NULL ";

    sql += " AND    cg.NO_SITE = 'S' AND sg.NO_SITE = 'S' "
    const [result]: any = await conn2.query(sql);
    return result[0].total as number;
  }
 
  /**
   * Retorna um produto com os campos necessarios para enviar para shopify, consulta feita 
   * pelo codigo do produto e tabela dae preço. OBS: priceTable opcional.
   * @param codeProduct codigo do produto
   * @param priceTable codigo da tabela de preço
   * @returns ICompleteProduct[]
   */
  async findSingleCompleteErpProduct(codeProduct: number, priceTable?: number, ativo?: 'S' | 'N'  ): Promise<ICompleteProduct[]> {


    let baseSql = `SELECT
                p.CODIGO,
                p.OUTRO_COD,
                coalesce(DATE_FORMAT(p.DATA_RECAD, '%Y-%m-%d %H:%i:%s') ,'0000-00-00 00:00:00') AS DATA_RECAD,
                p.SKU_MKTPLACE,
                p.DESCR_CURTA_MKTPLACE,
                p.DESCR_LONGA_MKTPLACE,
                p.DESCR_CURTA_SITE,
                p.DESCR_LONGA_SITE,
                p.APLICACAO_SITE,
                p.TITULO_SITE,
                p.DESCRICAO,
                CAST(p.APLICACAO AS CHAR(10000)  CHARACTER SET latin1) AS APLICACAO,
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
                cf.NCM,
                sg.DESCRICAO AS SUBCATEGORIA,
                cg.NOME AS CATEGORIA,
                pc.INDEXADO,
                 isv.id_produto_pai,
                isv.variante_id
                   
                
            `

    let middleOfSql = `
                     FROM ${db_publico}.cad_prod p
                    LEFT JOIN ${db_publico}.cad_pmar m ON m.codigo = p.marca
                    LEFT JOIN ${db_publico}.class_fiscal cf ON cf.CODIGO = p.CLASS_FISCAL
                    LEFT JOIN ${db_publico}.cad_pgru cg ON cg.CODIGO = p.GRUPO
                    LEFT JOIN ${db_publico}.subgrupos sg ON sg.CODIGO = p.SUBGRUPO  AND cg.CODIGO = sg.COD_GRUPO
                    LEFT JOIN ${db_publico}.prod_custos pc on (pc.PRODUTO = p.CODIGO) AND (pc.FILIAL = 2)
                    LEFT JOIN ${this.database_api}.produtos isp on isp.erp_sku = p.CODIGO
                    LEFT JOIN ${this.database_api}.variantes isv on isv.erp_sku = p.CODIGO 
              `

    const conditions = []
    const values = []

    const whereClause = " WHERE  ";
    const groupBy = '  GROUP BY p.CODIGO ORDER BY p.CODIGO;';

    if (priceTable) {
      baseSql += `,coalesce(tp.PRECO, 0 ) PRECO,
                coalesce(tp.PROMOCAO, 0) PROMOCAO ,
                DATE_FORMAT(tp.VALID_PROM, '%Y-%m-%d') as VALID_PROM` 
      middleOfSql += ` LEFT JOIN ${db_publico}.prod_tabprecos tp ON p.CODIGO = tp.PRODUTO  and tp.tabela = ${priceTable} `;
    } else {
      middleOfSql += ` LEFT JOIN ${db_publico}.prod_tabprecos tp ON p.CODIGO = tp.PRODUTO  `;
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
    const [rows] = await conn2.query(finalSql, values) as any;

    return rows;
  }


  /**
   * Obtem uma lista de produtos do erp alterado após a data informada.
   * @param updated_at 
   * @returns IProductSystem[]
   */
  async findProductsErp(updated_at?: string): Promise<IProductSystem[]> {
    let baseSql = ` 
                            SELECT * FROM ${db_publico}.cad_prod  WHERE
                            `;
    let finalSql = baseSql;

    finalSql = baseSql + ` ATIVO = 'S' `;
    if (updated_at) {
      finalSql = baseSql + ` AND  DATA_RECAD > ${updated_at};`
    }
    const [rows] = await conn2.query(finalSql);
    return rows as any;

  }

  /**
   * Obtem um produto do erp, consulta feita pelo codigo.
   * @param codigo 
   * @returns IProductSystem[] 
   */
  async findByCodeProductErp(codigo: number): Promise<IProductSystem[]> {
    let sql = `SELECT * FROM ${db_publico}.cad_prod WHERE     CODIGO = ${codigo};`;
    const [rows] = await conn2.query(sql);
    return rows as any
  }


  /**
   * Retorna uma lista de  produtos do erp que não pode ir para o site.
   * @param param0 
   * @returns resultIsDisabledProductSite[]
   */
  async findProductsToInactivateSite(   limit?:number, offset?:number  ): Promise<resultIsDisabledProductSite[]> {
    

    let baseSql = `
       SELECT
                p.CODIGO,
                isv.id_produto_pai,
                isv.variante_id ,
                p.NO_SITE PRODUTO_NO_SITE,
                sg.NO_SITE SUBGRUPO_NO_SITE,
                cg.NO_SITE GRUPO_NO_SITE
                     FROM ${db_publico}.cad_prod p
                     JOIN ${this.database_api}.variantes isv on isv.erp_sku = p.CODIGO 
                     JOIN ${db_publico}.cad_pgru cg ON cg.CODIGO = p.GRUPO 
                    LEFT JOIN ${db_publico}.subgrupos sg ON sg.CODIGO = p.SUBGRUPO 
                      WHERE 
                      p.ATIVO='S'   
							AND ( p.NO_SITE = 'N' OR cg.NO_SITE = 'N' OR sg.NO_SITE = 'N' )`;
    
        if (limit !== undefined && offset !== undefined) {
          baseSql += ` LIMIT ${limit} OFFSET ${offset} `;
        }

        const [rows] = await conn2.query(baseSql)
    return rows as resultIsDisabledProductSite[]
  }

  // async findProductsShippedWhithStock():Promise<[{erp_sku:number, shopify_product_id:string}]>{
  //     const sql = `
  //     SELECT 
  //       
  //     `
  // }

  async acquireLock(sku: number, timeout = 30): Promise<boolean> {
    const [rows]: any = await conn2.query(
      `SELECT GET_LOCK(?, ?) as result`,
      [`sync_produto_${sku}`, timeout]
    );
    return rows[0]?.result === 1;
  }

  async releaseLock(sku: number): Promise<boolean> {
    const [rows]: any = await conn2.query(
      `SELECT RELEASE_LOCK(?) as result`,
      [`sync_produto_${sku}`]
    );
    return rows[0]?.result === 1;
  }
 
}