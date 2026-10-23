import mysql, { type ResultSetHeader } from 'mysql2/promise'

/** Modulo com configuracao gravada: um booleano S/N */
export type FlagConfig = 'S' | 'N'

/** Linha da tabela db_api.config */
export interface ConfigRow {
    id: number
    modulo: string
    cron: FlagConfig
    eventos: FlagConfig
    expressao_cron: string
}

/** Dados gravados pela rota POST /api/config/:modulo (id nao e informado) */
export interface ConfigInput {
    modulo: string
    cron: FlagConfig
    eventos: FlagConfig
    expressao_cron: string
}

/**
 * Acesso a tabela de configuracoes da integracao (db_api.config).
 *
 * Uma linha por modulo (pedidos, produtos, ...): se o modulo roda por cron,
 * se opera com eventos e qual expressao cron usar.
 * Salvar usa INSERT ... ON DUPLICATE KEY UPDATE, entao gravar de novo apenas atualiza.
 *
 * O nome do banco vem com crase de database-connection.ts, por isso e usado direto:
 * ${this.database}.config
 */
export class ConfigRepository {

    private connection: mysql.Pool
    private database: string

    constructor(connection: mysql.Pool, database: string) {
        this.connection = connection
        this.database = database
    }

    /**
     * Todas as configuracoes, ordenadas por modulo.
     * @returns ConfigRow[]
     */
    async findAll(): Promise<ConfigRow[]> {
        const sql = `SELECT * FROM ${this.database}.config ORDER BY modulo ASC`

        const [rows] = await this.connection.query(sql)

        return rows as ConfigRow[]
    }

    /**
     * Configuracao de um modulo.
     * @param modulo chave logica do modulo (ex.: pedidos)
     * @returns ConfigRow[] (vazio quando o modulo ainda nao foi configurado)
     */
    async findByModulo(modulo: string): Promise<ConfigRow[]> {
        const sql = `SELECT * FROM ${this.database}.config WHERE modulo = ?`

        const [rows] = await this.connection.query(sql, [modulo])

        return rows as ConfigRow[]
    }

    /**
     * Grava (ou sobrescreve) a configuracao de um modulo.
     * A chave unica e o modulo, entao gravar de novo atualiza os 3 campos.
     * @param input dados do modulo
     * @returns ResultSetHeader do INSERT
     */
    async salvar(input: ConfigInput): Promise<ResultSetHeader> {
        const sql = `INSERT INTO ${this.database}.config (modulo, cron, eventos, expressao_cron)
                     VALUES (?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                        cron = VALUES(cron),
                        eventos = VALUES(eventos),
                        expressao_cron = VALUES(expressao_cron)`

        const values = [input.modulo, input.cron, input.eventos, input.expressao_cron]

        const [rows] = await this.connection.query(sql, values)

        return rows as ResultSetHeader
    }
}
