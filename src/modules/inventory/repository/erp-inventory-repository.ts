import { conn2, database_api, db_estoque, db_publico, db_vendas } from "../../../database/database-connection.ts";


type setores = {
  CODIGO: number
  NOME: string
  ATIVO: 'S' | 'N'
  PADRAO_VENDA: 'X' | ''
  PADRAO_COMPRA: 'X' | ''
  PADRAO_PRODUCAO: 'X' | ''
  EST_ATUAL: 'X' | ''
  DATA_CADASTRO: string
}

type resultEstoqueProdutos = {
  DATA_RECAD: string | null
  ESTOQUE: number
  variante_id: string
  erp_sku: number
  setor: number
  id_local_shopify: string
  id_local: string
  ultimo_saldo_enviado: string
  ultimo_envio_estoque: string
  inventoryItemId: string
   is_activate_inventory: 'S' | 'N',
   trava_estoque: 'S' | 'N' 

}

export class ErpInventoryRepository {

   private database_api = `\`${database_api}\``;
 
      async findSectorErp(filial?: number, estoque_atual?: 'X', nome?: string): Promise<setores[]> {
        const sql = `SELECT s.* FROM ${db_estoque}.setores s 
            join ${db_vendas}.empresas_setor es  on s.CODIGO = es.SETOR
    
          `;
        const conditions = [];
        const values = [];
    
        if (filial) {
          conditions.push(' es.FILIAL = ? ');
          values.push(filial);
        }
    
        if (estoque_atual) {
          conditions.push(' s.EST_ATUAL = ? ')
          values.push(`${estoque_atual}`)
        }
    
        if (nome) {
          conditions.push(' s.NOME = ? ')
          values.push(`${nome}`)
        }
        conditions.push(' s.ATIVO =  ? ')
        values.push('S')
    
        const whereClause = ' WHERE '
        const finalSql = sql + whereClause + conditions.join(' AND ') + ' GROUP BY s.CODIGO '
        const [rows] = await conn2.query(finalSql, values)
        return rows as any
    
      }


   
      
        /**
         * obtem o saldo real dos produtos dos setores referente a syma sc
         *   
         */
        async buscaSaldoRealProdutosSymaSc(codigo?: number): Promise<resultEstoqueProdutos[]> {

    let baseSql = `SELECT
          EST.DATA_RECAD,
          VL.variante_id,
          VL.erp_sku,
          VL.id_local_shopify,
          VL.id_local,
          VL.estoque AS ultimo_saldo_enviado,
          VL.ultimo_envio_estoque,
          VL.is_activate_inventory,
          VL.inventoryItemId,
          VL.trava_estoque,
          GREATEST(EST.ESTOQUE_TOTAL - COALESCE(RES.RESERVADO, 0), 0) AS ESTOQUE
      
      FROM(
          SELECT
              PS.PRODUTO,
              MAX(PS.DATA_RECAD) AS DATA_RECAD,
              SUM(PS.ESTOQUE) AS ESTOQUE_TOTAL
          FROM mesquita_vendas.empresas_setor S
      
          INNER JOIN mesquita_estoque.prod_setor PS
              ON PS.SETOR = S.SETOR
            AND PS.SETOR   IN (469,471)
      
          WHERE S.FILIAL = 2
            AND S.EST_ATUAL = 'X'
      
          GROUP BY PS.PRODUTO
        ) EST
      
      INNER JOIN mesquita_publico.cad_prod P ON P.CODIGO = EST.PRODUTO AND P.ATIVO = 'S' `
          
          const finalSql =  `
                LEFT JOIN   ${this.database_api}.variantes_locais VL ON VL.id_local = 2 AND VL.erp_sku = EST.PRODUTO
                
                LEFT JOIN
                (
                    SELECT
                        PO.PRODUTO,
                        SUM(
                            (
                                IF(
                                    PO.QTDE_SEPARADA > (PO.QUANTIDADE - PO.QTDE_MOV),
                                    PO.QTDE_SEPARADA,
                                    PO.QUANTIDADE - PO.QTDE_MOV
                                )
                                * PO.FATOR_QTDE
                            )
                            * IF(CO.TIPO = '5', -1, 1)
                        ) AS RESERVADO
                
                    FROM mesquita_vendas.cad_orca CO
                
                    INNER JOIN mesquita_vendas.pro_orca PO ON PO.ORCAMENTO = CO.CODIGO
                
                    WHERE CO.SITUACAO IN ('AI','AP','FP')
                
                
                    GROUP BY PO.PRODUTO
                ) RES
                    ON RES.PRODUTO = EST.PRODUTO
                    ;`
      if (codigo) {
              baseSql += `  AND P.CODIGO = ${codigo} `
          }

            const sql =  baseSql+finalSql;
          const [result] = await conn2.query(sql)
          return result as any;
        }
      
      
        /**
       * obtem o saldo real dos produtos dos setores referente a loja  
       */
        async buscaSaldoRealProdutosLoja(codigo?: number): Promise<resultEstoqueProdutos[]> {
      
           let baseSql= 
           `
           SELECT
              EST.DATA_RECAD,
              VL.variante_id,
              VL.erp_sku,
              VL.id_local_shopify,
              VL.id_local,
              VL.estoque AS ultimo_saldo_enviado,
              VL.ultimo_envio_estoque,
              VL.is_activate_inventory,
              VL.inventoryItemId,
             VL.trava_estoque,
              GREATEST(EST.ESTOQUE_TOTAL - COALESCE(RES.RESERVADO, 0), 0) AS ESTOQUE
          
          FROM(
              SELECT
                  PS.PRODUTO,
                  MAX(PS.DATA_RECAD) AS DATA_RECAD,
                  SUM(PS.ESTOQUE) AS ESTOQUE_TOTAL
              FROM mesquita_vendas.empresas_setor S
          
              INNER JOIN mesquita_estoque.prod_setor PS
                  ON PS.SETOR = S.SETOR
                AND PS.SETOR NOT IN (469,471,475)
          
              WHERE S.FILIAL = 2
                AND S.EST_ATUAL = 'X'
          
              GROUP BY PS.PRODUTO
            ) EST
          
          INNER JOIN mesquita_publico.cad_prod P ON P.CODIGO = EST.PRODUTO AND P.ATIVO = 'S'
                    `;
      const finalSql = `
          LEFT JOIN ${this.database_api}.variantes_locais VL ON VL.id_local = 1 AND VL.erp_sku = EST.PRODUTO
          LEFT JOIN
          (
              SELECT
                  PO.PRODUTO,
                  SUM(
                      (
                          IF(
                              PO.QTDE_SEPARADA > (PO.QUANTIDADE - PO.QTDE_MOV),
                              PO.QTDE_SEPARADA,
                              PO.QUANTIDADE - PO.QTDE_MOV
                          )
                          * PO.FATOR_QTDE
                      )
                      * IF(CO.TIPO = '5', -1, 1)
                  ) AS RESERVADO
          
              FROM mesquita_vendas.cad_orca CO
          
              INNER JOIN mesquita_vendas.pro_orca PO ON PO.ORCAMENTO = CO.CODIGO
          
              WHERE CO.SITUACAO IN ('AI','AP','FP')
          
              GROUP BY PO.PRODUTO
          ) RES
              ON RES.PRODUTO = EST.PRODUTO;`;
                    
        if (codigo) {
              baseSql += `  AND P.CODIGO = ${codigo} `
          }
          const sql = baseSql+finalSql;
          const [rows] = await conn2.query(sql)
          return rows as any;
        }
      
       


}