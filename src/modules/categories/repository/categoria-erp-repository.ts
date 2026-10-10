import mysql from 'mysql2/promise';
import { type cad_pgru } from "../../../shared/interfaces/cad_pgru.ts";
import { type subgrupos } from '../../../shared/interfaces/subgrupos.ts';
 
export class CategoryErpRepository {
    private databasePublico:string ; 
    private connection: mysql.Pool;
    private databaseIntegration: string;

    constructor( connection:mysql.Pool, databasePublico:string, databaseIntegration: string){
        this.connection = connection
        this.databasePublico= databasePublico
        this.databaseIntegration = databaseIntegration
    }


    async checkCategoriesForUpdates(NO_SITE : "S" | "N" = 'S'){
        let sql = ` SELECT cg.* 
            FROM ${this.databasePublico}.cad_pgru cg
           LEFT JOIN ${this.databaseIntegration}.categorias c on c.codigo_erp = cg.CODIGO AND c.nivel = 'grupo'
           WHERE ATIVO = 'S' AND NO_SITE = ?
             ;`;

            
        const [rows] = await this.connection.query( sql, NO_SITE );
            return rows as cad_pgru[];
    }

  async checkSubCategoriesForUpdates(NO_SITE : "S" | "N" = 'S'){
        const sql = ` SELECT sg.* 
            FROM ${this.databasePublico}.subgrupos sg
            JOIN ${this.databaseIntegration}.categorias c on c.codigo_erp = sg.CODIGO AND c.nivel = 'subgrupo'
           WHERE  NO_SITE = ?
            ;`;
        
        const [rows] = await this.connection.query( sql,NO_SITE );
            return rows as subgrupos[];
    }

   

   async findCategoryErpByParams(query:{ CODIGO?: number, NO_SITE: "S" | "N" }  ){

      const   { NO_SITE, CODIGO } = query;

        const conditions =[]  
        const values= [];
            if( CODIGO ){
                conditions.push(" CODIGO = ? " );
                values.push(CODIGO);
            }

            if(NO_SITE){
                conditions.push(" NO_SITE = ? " );
                values.push(NO_SITE);
            }

        const sql = `SELECT
                        CODIGO,
                        NOME,
                        NO_SITE,
                        IMPORTADO_SITE,
                        ALTERADO_SITE,
                        ATIVO,
                        coalesce(DATE_FORMAT( DATA_RECAD, '%Y-%m-%d %H:%i:%s'), '0000-00-00 00:00:00') AS DATA_RECAD
                    FROM ${this.databasePublico}.cad_pgru  `
                    const orderBy = ` ORDER BY CODIGO ASC `;
                     
                        const finalSql =  sql + "WHERE" + conditions.join(` AND `) + orderBy 

        const [rows] = await this.connection.query(finalSql, values );
            return rows as cad_pgru[];
    }
 


    async findSubCategoryErpByParams(query:{ CODIGO?: number, NO_SITE: "S" | "N" }  ){
        const   { NO_SITE, CODIGO } = query;

            const conditions =[]  
            const values= [];
                if( CODIGO ){
                    conditions.push(" CODIGO = ? " );
                    values.push(CODIGO);
                }

                if(NO_SITE){
                    conditions.push(" NO_SITE = ? " );
                    values.push(NO_SITE);
                }

            const sql = `SELECT
                        *,
                        
                            coalesce(DATE_FORMAT( DATA_CADASTRO, '%Y-%m-%d'), '0000-00-00') AS DATA_CADASTRO,
                            coalesce(DATE_FORMAT( DATA_RECAD, '%Y-%m-%d %H:%i:%s'), '0000-00-00 00:00:00') AS DATA_RECAD
                        FROM ${this.databasePublico}.subgrupos  `
                        const orderBy = ` ORDER BY CODIGO ASC `;
                        
                            const finalSql =  sql + "WHERE" + conditions.join(` AND `) + orderBy 


            const [rows] = await this.connection.query(finalSql, values );
                return rows as subgrupos[];
    }

}