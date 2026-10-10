
type resultStockProductToShipping = {
    CODIGO:number 
    ESTOQUE:number
    ULTIMO_SALDO_ENVIADO:number,
    id_produto_nuvemshop:number,
    id_variante_nuvemshop:number 
}


type resultPriceProductToShipping = {
    CODIGO:number 
    PRECO:number
    ULTIMO_PRECO_ENVIADO:number,
    ULTIMO_PROMOCAO_ENVIADA:number,
    id_produto_nuvemshop:number,
    id_variante_nuvemshop:number 
    PROMOCAO: number
}


import mysql from 'mysql2/promise'
export class InventoryRepository { 

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
 

  async  findStockProductToShipping():Promise<resultStockProductToShipping[]>{

        const sql =`
				SELECT
                    P.CODIGO,
                    GREATEST(COALESCE(EST.ESTOQUE_TOTAL, 0) - COALESCE(RES.RESERVADO, 0), 0) AS ESTOQUE,
					 ip.estoque as ULTIMO_SALDO_ENVIADO,
                     ip.id_produto_nuvemshop,
                     ip.id_variante_nuvemshop 

                FROM ${this.databasePublico}.cad_prod P
				JOIN ${this.databaseIntegration}.produtos ip on ip.codigo_erp = P.CODIGO 
                LEFT JOIN (
                    SELECT
                        PS.PRODUTO,
                        MAX(PS.DATA_RECAD) AS DATA_RECAD,
                        SUM(PS.ESTOQUE) AS ESTOQUE_TOTAL
                    FROM ${this.databaseEstoque}.prod_setor PS
                    WHERE PS.SETOR IN (
                        SELECT DISTINCT S.SETOR
                        FROM ${this.databaseVendas}.empresas_setor S
                        WHERE S.EST_ATUAL = 'X'   AND  S.EST_REAL = 'X' 
                    )  
                    GROUP BY PS.PRODUTO 
                ) EST ON EST.PRODUTO = P.CODIGO

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
                WHERE P.ATIVO = 'S';
            `
         const [rows] = await this.connection.query(sql ) as any;
        return rows
    }


    async findPriceProductToShipping():Promise<resultPriceProductToShipping[]>{

        const sql = `
            SELECT 
            tp.PRODUTO as CODIGO,
            tp.PRECO,
            ip.preco as ULTIMO_PRECO_ENVIADO,
            ip.promocao as ULTIMO_PROMOCAO_ENVIADA,
            ip.id_produto_nuvemshop,
            ip.id_variante_nuvemshop,
            if( NOW() > tp.VALID_PROM , 0, tp.PROMOCAO ) as PROMOCAO
                from ${this.databasePublico}.prod_tabprecos tp
                join ${this.databaseIntegration}.produtos ip on ip.codigo_erp = tp.PRODUTO
                GROUP BY tp.PRODUTO 
        `;
               const [rows] = await this.connection.query(sql ) as any;
        return rows
    }
        
         
}
