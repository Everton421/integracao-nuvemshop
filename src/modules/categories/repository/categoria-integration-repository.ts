import { type ResultSetHeader } from "mysql2/promise"
import { type CategoriaIntegracao, type NivelCategoria } from "../../../shared/interfaces/categoria-integracao.ts"
import mysql from 'mysql2/promise'
/**
 * Guarda o vinculo entre a categoria do ERP e o id devolvido pela Nuvemshop.
 * Sem essa tabela nao da para atualizar uma categoria sem recria-la, e o id do pai
 * se perde entre execucoes.
 */
export class CategoriaIntegrationRepository {

    private database:string ; 
    private connection: mysql.Pool;

    constructor( connection:mysql.Pool, database:string){
        this.connection = connection
        this.database= database
    }
    /**
     * Insere ou atualiza o registro de uma categoria.
     *
     * @param input erp_codigo, nivel, erp_codigo_pai, nome, id_nuvemshop, parent_id_nuvemshop,
     *             sync_status, error_message, dados_categoria, ultimo_envio
     */
    async insertOrUpdate(input: {
        erp_codigo: number,
        nivel: NivelCategoria,
        erp_codigo_pai?: number | null,
        nome: string,
        id_nuvemshop?: string | null,
        parent_id_nuvemshop?: string | null,
        sync_status: 'pending' | 'synced' | 'error',
        error_message?: string | null,
        dados_categoria?: string | null,
        ultimo_envio: string
    }): Promise<ResultSetHeader> {

        const sql = `INSERT INTO ${this.database}.categorias
                        SET erp_codigo         = ?,
                            nivel              = ?,
                            erp_codigo_pai     = ?,
                            nome               = ?,
                            id_nuvemshop       = ?,
                            parent_id_nuvemshop= ?,
                            sync_status        = ?,
                            error_message      = ?,
                            dados_categoria    = ?,
                            ultimo_envio       = ?
                      ON DUPLICATE KEY UPDATE
                            erp_codigo_pai      = VALUES(erp_codigo_pai),
                            nome                = VALUES(nome),
                            id_nuvemshop        = VALUES(id_nuvemshop),
                            parent_id_nuvemshop = VALUES(parent_id_nuvemshop),
                            sync_status         = VALUES(sync_status),
                            error_message       = VALUES(error_message),
                            dados_categoria     = VALUES(dados_categoria),
                            ultimo_envio        = VALUES(ultimo_envio)`

        const values = [
            input.erp_codigo,
            input.nivel,
            input.erp_codigo_pai ?? null,
            input.nome,
            input.id_nuvemshop ?? null,
            input.parent_id_nuvemshop ?? null,
            input.sync_status,
            input.error_message ?? null,
            input.dados_categoria ?? null,
            input.ultimo_envio,
        ]

        const [rows] = await this.connection.query(sql, values)
        return rows as ResultSetHeader
    }

    /**
     * Registra a falha de uma categoria, preservando o id ja conhecido para tentar
     * de novo na proxima execucao.
     *
     * @param nivel grupo ou subgrupo
     * @param codigo codigo da categoria no ERP
     * @param erro mensagem do erro
     * @param ultimo_envio timestamp da tentativa
     */
    async registrarErro(
        nivel: NivelCategoria,
        codigo: number,
        nome: string,
        erro: string,
        ultimo_envio: string
    ): Promise<ResultSetHeader> {

        return this.insertOrUpdate({
            erp_codigo: codigo,
            nivel,
            nome,
            sync_status: 'error',
            error_message: erro.slice(0, 2000),
            ultimo_envio,
        })
    }

    /**
     * Busca uma categoria pelo par nivel + codigo do ERP.
     *
     * @returns CategoriaIntegracao[]
     */
    async findByErpCodigo(nivel: NivelCategoria, codigo: number): Promise<CategoriaIntegracao[]> {

        const sql = `SELECT * FROM ${this.database}.categorias
                      WHERE nivel = ? AND erp_codigo = ?
                      LIMIT 1`

        const [rows] = await this.connection.query(sql, [nivel, codigo])
        return rows as CategoriaIntegracao[]
    }

    /**
     * Mapa { nivel -> { codigo_erp -> registro } } carregado de uma vez.
     * O job sempre precisa do estado completo das categorias pendentes para resolver
     * o parent_id dos subgrupos sem bater no banco a cada item.
     *
     * @returns Map<NivelCategoria, Map<number, CategoriaIntegracao>>
     */
    async findMapaPorCodigoErp(): Promise<Map<NivelCategoria, Map<number, CategoriaIntegracao>>> {

        const sql = `SELECT * FROM ${this.database}.categorias`

        const [rows] = await this.connection.query(sql)
        const registros = rows as CategoriaIntegracao[]

        const mapa = new Map<NivelCategoria, Map<number, CategoriaIntegracao>>([
            ['grupo', new Map()],
            ['subgrupo', new Map()],
        ])

        for (const registro of registros) {
            const porCodigo = mapa.get(registro.nivel)
            if (porCodigo) porCodigo.set(registro.erp_codigo, registro)
        }

        return mapa
    }

    /**
     * Todos os registros, para a tela /categorias.
     *
     * @returns CategoriaIntegracao[]
     */
    async findAll(): Promise<CategoriaIntegracao[]> {
        const sql = `SELECT * FROM ${this.database}.categorias ORDER BY nivel, erp_codigo`
        const [rows] = await this.connection.query(sql)
        return rows as CategoriaIntegracao[]
    }

    async checkShippmentstatus (erp_category_sku:number):Promise<CategoriaIntegracao[]>{
      return []
    }
}