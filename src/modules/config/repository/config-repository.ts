import mysql from 'mysql2/promise'

/** Linha da tabela db_api.modulo_configuracoes */
export interface ConfiguracaoRow {
    id: number
    modulo: string
    chave: string
    valor: string | null
    created_at: string
    updated_at: string
}

/**
 * Acesso a tabela de configuracoes da integracao (db_api.modulo_configuracoes).
 *
 * Uma linha por chave configuravel: modulo + chave sao unicos e o valor e um texto.
 * Salvar usa INSERT ... ON DUPLICATE KEY UPDATE, entao gravar de novo apenas atualiza.
 *
 * O nome do banco vem com crase de database-connection.ts, por isso e usado direto:
 * ${this.database}.modulo_configuracoes
 */
export class ConfigRepository {

    private connection: mysql.Pool
    private database: string

    constructor(connection: mysql.Pool, database: string) {
        this.connection = connection
        this.database = database
    }

    /**
     * Carrega todas as configuracoes, agrupadas por modulo na propria consulta.
     *
     * @returns Record<string, Record<string, string>> { modulo: { chave: valor } }
     */
    async findAll(): Promise<Record<string, Record<string, string>>> {
        const sql = `SELECT modulo, chave, valor
                     FROM ${this.database}.modulo_configuracoes
                     ORDER BY modulo ASC, chave ASC`

        const [rows] = await this.connection.query(sql)

        const agrupado: Record<string, Record<string, string>> = {}

        for (const linha of rows as ConfiguracaoRow[]) {
            agrupado[linha.modulo] ??= {}
            agrupado[linha.modulo][linha.chave] = linha.valor ?? ''
        }

        return agrupado
    }

    /**
     * Configuracoes de um modulo.
     *
     * @param modulo chave do modulo (ex.: categorias)
     * @returns ConfiguracaoRow[]
     */
    async findByModulo(modulo: string): Promise<ConfiguracaoRow[]> {
        const sql = `SELECT * FROM ${this.database}.modulo_configuracoes
                     WHERE modulo = ? ORDER BY chave ASC`
        const [rows] = await this.connection.query(sql, [modulo])

        return rows as ConfiguracaoRow[]
    }

    /**
     * Grava (ou sobrescreve) as chaves enviadas de um modulo.
     *
     * @param modulo chave do modulo
     * @param valores mapa chave -> valor
     * @returns number quantidade de campos enviados
     */
    async salvar(modulo: string, valores: Record<string, string>): Promise<number> {
        const chaves = Object.keys(valores)

        if (chaves.length === 0) {
            return 0
        }

        const linhas = chaves.map(() => '(?, ?, ?)').join(', ')
        const params: unknown[] = []

        for (const chave of chaves) {
            params.push(modulo, chave, valores[chave])
        }

        const sql = `INSERT INTO ${this.database}.modulo_configuracoes (modulo, chave, valor)
                     VALUES ${linhas}
                     ON DUPLICATE KEY UPDATE valor = VALUES(valor)`

        await this.connection.query(sql, params)

        return chaves.length
    }
}