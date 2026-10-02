import mysql from 'mysql2/promise';
import { cad_pgru } from "../../../shared/interfaces/cad_pgru.ts";
 
export class CategoryErpRepository {
   private databasePublico:string ; 
    private connection: mysql.Pool;

    constructor( connection:mysql.Pool, databasePublico:string){
        this.connection = connection
        this.databasePublico= databasePublico
    }


   async findErpCategoryByParams(query:{ CODIGO?: number, NO_SITE: "S" | "N" }  ){

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
                     
                        const finalSql =  "WHERE" + conditions.join(` AND `) + orderBy 


        const [rows] = await this.connection.query(finalSql, values );
            return rows as cad_pgru[];
    }
 
}