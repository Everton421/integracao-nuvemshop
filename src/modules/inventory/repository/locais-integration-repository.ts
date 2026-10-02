import { type ResultSetHeader } from "mysql2"
import { conn2, database_api } from "../../../database/database-connection.ts"
 
type inputLocal =
    {
        id: string,
        nome: string
    }

type locais = {
    id: number,
    id_shopify: string
    nome: string,
    created_at: string
    updated_at: string
}

export class LocaisIntegration {
    private database = `\`${database_api}\``

    async insertOrUpdate(local: inputLocal) {

        const sql = `
                INSERT INTO ${this.database}.locais 
                SET 
                    id_shopify = '${local.id}',
                    nome = '${local.nome}',
                         ON DUPliCATE KEY UPDATE 
                    nome = '${local.nome}',
                    ; `
        const [rows] = await conn2.query(sql)
        return rows as ResultSetHeader
    }

    async insert(local: inputLocal): Promise<ResultSetHeader> {

        const sql = `
                INSERT INTO ${this.database}.locais 
                SET 
                    id_shopify = ?,
                    nome = ? ;`;

        const data = [local.id, local.nome]
        const [rows] = await conn2.query(sql, data)
        return rows as ResultSetHeader

    }

    async selectAll(): Promise<locais[]> {


        const sql = `
                    SELECT * FROM ${this.database}.locais;
                        `
        const [rows] = await conn2.query(sql)
        return rows as locais[];
    }

    async update(input: { nome?: string }, id_local_shopify: string) {

        const sql = ` UPDATE ${this.database}.locais set   `

        const conditions = []
        const values = []

        if (input.nome) {
            conditions.push(' nome = ? ')
            values.push(`${input.nome}`)
        }


        const whereClause = ' WHERE id_shopify = ? '
        values.push(`${id_local_shopify}`)

        const finalSql = sql + conditions.join(' , ') + whereClause

        const [rows] = await conn2.query(finalSql, values)
        return rows as ResultSetHeader;

    }

    async selectById(id: number): Promise<locais[]> {

        const sql = `
                SELECT * FROM ${this.database}.locais where id = ? ;
                    `
        const [rows] = await conn2.query(sql, id)
        return rows as locais[];
    }

    async select(input: { id_shopify: string }): Promise<locais[]> {
        const sql = `
                SELECT * FROM ${this.database}.locais  
                    `
        const conditions = []
        const values = []
        if (input.id_shopify) {
            conditions.push(' id_shopify = ? ')
            values.push(`${input.id_shopify}`);
        }
        const whereClause = ' WHERE '
        const finalSql = sql + whereClause + conditions.join(' AND ');

        const [rows] = await conn2.query(finalSql, values)
        return rows as locais[];

    }
}