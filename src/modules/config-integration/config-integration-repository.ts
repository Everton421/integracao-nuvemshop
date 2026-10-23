import mysql from 'mysql2/promise'
import { type typeConfigIntegration } from './types/confg-integration.ts';

export class ConfigIntegrationRepository{
    
        private connection: mysql.Pool;
        private databaseIntegration: string;
    
        constructor( connection:mysql.Pool,   databaseIntegration: string,  ){
            this.connection = connection
            this.databaseIntegration = databaseIntegration
        }
     
        async findAll():Promise<typeConfigIntegration[]>{
                const sql = `SELECT * FROM ${this.databaseIntegration}.config_integracao WHERE id =1 ; `;
                const [rows] = await this.connection.query(sql ) as any;
                return rows
        }

        /**
         * Atualiza a data do ultimo recebimento de pedidos.
         * @param data data no formato 'YYYY-MM-DD HH:mm:ss'
         * @returns resultado do UPDATE
         */
        async updateUltimoRecebimentoPedido(data:string){
                const sql = `UPDATE ${this.databaseIntegration}.config_integracao
                             SET ultimo_recebimento_pedido = ?
                             WHERE id = 1 ;`;
                const [rows] = await this.connection.query(sql, [ data ]) as any;
                return rows
        }

}