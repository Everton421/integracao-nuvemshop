import mysql, { type ResultSetHeader } from 'mysql2/promise'

/**
 * Linha da tabela db_api.produtos.
 *
 * Tabela unica: 1 produto = 1 variante (envio unico para a Nuvemshop).
 * Guarda o id do produto e o id da variante na Nuvemshop, os JSONs enviados
 * (produto e variante), preco/estoque enviados e as datas de ultimo envio de cada um.
 */
export interface ProdutoRow {
    id: number
    id_variante_nuvemshop: string | null
    id_produto_nuvemshop: string | null
    codigo_erp: number
    nome: string
    dados_variante: string | null
    dados_produto: string | null
    preco: number | string | null
    promocao: number | string | null
    estoque: number | string | null
    ultimo_envio_estoque: string
    ultimo_envio_preco: string
    ultimo_envio_produto: string
    created_at: string
    updated_at: string
}

/** Resultado padrao dos inserts: os services checam `sucess` */
export interface ResultadoInsert {
    sucess: boolean
    insertId: number
    mensagem?: string
}

/** Ids devolvidos pela Nuvemshop apos criar/atualizar produto e variante */
export interface IdsNuvemshop {
    idProdutoNuvemshop?: string
    idVarianteNuvemshop?: string
}

const COLUNAS_PRODUTO = [
    'id', 'id_variante_nuvemshop', 'id_produto_nuvemshop', 'codigo_erp',
    'nome', 'dados_variante', 'dados_produto', 'preco', 'promocao', 'estoque',
    'ultimo_envio_estoque', 'ultimo_envio_preco', 'ultimo_envio_produto',
    'created_at', 'updated_at'
] as const

const COLUNAS_GRAVAVEIS = [
    'id_variante_nuvemshop', 'id_produto_nuvemshop', 'nome',
    'dados_variante', 'dados_produto', 'preco', 'promocao', 'estoque',
    'ultimo_envio_estoque', 'ultimo_envio_preco', 'ultimo_envio_produto'
] as const

/** Data sentinela usada na seed para "nunca enviado" */
const NUNCA_ENVIADO = '2001-01-01 01:00:00'

/**
 * Monta o WHERE dinamico a partir de um mapa coluna -> valor.
 * Colunas que nao estao na lista sao ignoradas (protecao contra SQL injetado no nome da coluna).
 */
function montarWhere(
    params: Record<string, unknown>,
    colunasPermitidas: readonly string[]
): { where: string, values: unknown[] } {
    const condicoes: string[] = []
    const values: unknown[] = []

    for (const [coluna, valor] of Object.entries(params)) {
        if (valor === undefined) continue
        if (!colunasPermitidas.includes(coluna)) continue

        condicoes.push(`${coluna} = ?`)
        values.push(valor)
    }

    return { where: condicoes.join(' AND '), values }
}

/**
 * Acesso a tabela db_api.produtos (tabela unica produto + variante).
 *
 * Cada linha e um produto ja enviado (ou a enviar) para a Nuvemshop junto com
 * a sua unica variante: ids da Nuvemshop, JSONs enviados (produto e variante),
 * preco/estoque enviados e datas de ultimo envio.
 *
 * O nome do banco vem com crase de database-connection.ts, por isso e usado direto:
 * ${this.database}.produtos
 */
export class ProductIntegration {

    private connection: mysql.Pool
    private database: string

    constructor(connection: mysql.Pool, database: string) {
        this.connection = connection
        this.database = database
    }

    /**
     * Produto pelo id interno.
     * @param id id da tabela produtos
     */
    async findById(id: number): Promise<ProdutoRow[]> {
        const sql = `SELECT * FROM ${this.database}.produtos WHERE id = ?`
        const [rows] = await this.connection.query(sql, [id])

        return rows as ProdutoRow[]
    }

    /**
     * Produto pelo codigo no ERP (chave unica).
     * @param codigoErp codigo do produto no sistema
     */
    async findByCodigoErp(codigoErp: number): Promise<ProdutoRow[]> {
        const sql = `SELECT * FROM ${this.database}.produtos WHERE codigo_erp = ?`
        const [rows] = await this.connection.query(sql, [codigoErp])

        return rows as ProdutoRow[]
    }

    /**
     * Produto pelo id do produto na Nuvemshop.
     * @param idProdutoNuvemshop id do produto na Nuvemshop
     */
    async findByProdutoNuvemshopId(idProdutoNuvemshop: string): Promise<ProdutoRow[]> {
        const sql = `SELECT * FROM ${this.database}.produtos WHERE id_produto_nuvemshop = ?`
        const [rows] = await this.connection.query(sql, [idProdutoNuvemshop])

        return rows as ProdutoRow[]
    }

    /**
     * Produto pelo id da variante na Nuvemshop.
     * @param idVarianteNuvemshop id da variante na Nuvemshop
     */
    async findByVarianteNuvemshopId(idVarianteNuvemshop: string): Promise<ProdutoRow[]> {
        const sql = `SELECT * FROM ${this.database}.produtos WHERE id_variante_nuvemshop = ?`
        const [rows] = await this.connection.query(sql, [idVarianteNuvemshop])

        return rows as ProdutoRow[]
    }

    /**
     * Busca produtos por qualquer combinacao de colunas.
     * Colunas desconhecidas sao ignoradas. Ex.: selectByParam({ codigo_erp: 10 })
     * @param params mapa coluna -> valor
     * @returns ProdutoRow[]
     */
    async selectByParam(params: Record<string, unknown>): Promise<ProdutoRow[]> {
        const { where, values } = montarWhere(params, COLUNAS_PRODUTO)

        const sql = `SELECT * FROM ${this.database}.produtos` +
            (where ? ` WHERE ${where}` : '') +
            ` ORDER BY codigo_erp ASC`

        const [rows] = await this.connection.query(sql, values)

        return rows as ProdutoRow[]
    }

    /**
     * Todos os produtos da integracao.
     */
    async selectAll(): Promise<ProdutoRow[]> {
        const sql = `SELECT * FROM ${this.database}.produtos ORDER BY codigo_erp ASC`
        const [rows] = await this.connection.query(sql)

        return rows as ProdutoRow[]
    }

    /**
     * Produtos que nunca tiveram estoque enviado (ultimo_envio_estoque na data sentinela da seed).
     */
    async buscarPendentesEnvioEstoque(): Promise<ProdutoRow[]> {
        const sql = `SELECT * FROM ${this.database}.produtos
                     WHERE ultimo_envio_estoque <= '${NUNCA_ENVIADO}'
                     ORDER BY codigo_erp ASC`
        const [rows] = await this.connection.query(sql)

        return rows as ProdutoRow[]
    }

    /**
     * Produtos que nunca tiveram preco enviado (ultimo_envio_preco na data sentinela da seed).
     */
    async buscarPendentesEnvioPreco(): Promise<ProdutoRow[]> {
        const sql = `SELECT * FROM ${this.database}.produtos
                     WHERE ultimo_envio_preco <= '${NUNCA_ENVIADO}'
                     ORDER BY codigo_erp ASC`
        const [rows] = await this.connection.query(sql)

        return rows as ProdutoRow[]
    }

    /**
     * Insere o produto. Em caso de codigo_erp duplicado retorna sucess = false.
     * @param input dados do produto (codigo_erp e nome obrigatorios)
     */
    async inserir(input: Partial<ProdutoRow> & { codigo_erp: number, nome: string }): Promise<ResultadoInsert> {
        const colunas: string[] = []
        const values: unknown[] = []

        for (const [coluna, valor] of Object.entries(input)) {
            if (valor === undefined) continue
            if (!COLUNAS_PRODUTO.includes(coluna as any)) continue

            colunas.push(coluna)
            values.push(valor)
        }

        if (colunas.length === 0) {
            return { sucess: false, insertId: 0, mensagem: 'Nenhum campo valido para inserir.' }
        }

        const sql = `INSERT INTO ${this.database}.produtos (${colunas.join(', ')})
                     VALUES (${colunas.map(() => '?').join(', ')})`

        try {
            const [result] = await this.connection.query(sql, values) as ResultSetHeader[]

            return { sucess: result.affectedRows > 0, insertId: result.insertId }
        } catch (e: any) {
            if (e?.code === 'ER_DUP_ENTRY') {
                return { sucess: false, insertId: 0, mensagem: `Produto ${input.codigo_erp} ja cadastrado.` }
            }
            throw e
        }
    }

    /**
     * Atualiza campos do produto pelo codigo_erp.
     * @param input campos a atualizar (somente colunas gravaveis sao aceitas)
     * @param codigoErp codigo do produto no sistema
     * @returns quantidade de linhas alteradas
     */
    async update(input: Partial<ProdutoRow>, codigoErp: number): Promise<number> {
        const sets: string[] = []
        const values: unknown[] = []

        for (const [coluna, valor] of Object.entries(input)) {
            if (valor === undefined) continue
            if (!COLUNAS_GRAVAVEIS.includes(coluna as any)) continue

            sets.push(`${coluna} = ?`)
            values.push(valor)
        }

        if (sets.length === 0) return 0

        values.push(codigoErp)

        const sql = `UPDATE ${this.database}.produtos SET ${sets.join(', ')} WHERE codigo_erp = ?`
        const [result] = await this.connection.query(sql, values) as ResultSetHeader[]

        return result.affectedRows
    }

    /**
     * Grava o estoque enviado e atualiza a data do ultimo envio de estoque.
     * @param codigoErp codigo do produto no sistema
     * @param estoque estoque enviado
     * @returns quantidade de linhas alteradas
     */
    async updateEstoque(codigoErp: number, estoque: number): Promise<number> {
        const sql = `UPDATE ${this.database}.produtos
                     SET estoque = ?, ultimo_envio_estoque = NOW()
                     WHERE codigo_erp = ?`
        const [result] = await this.connection.query(sql, [estoque, codigoErp]) as ResultSetHeader[]

        return result.affectedRows
    }

    /**
     * Grava o preco enviado e atualiza a data do ultimo envio de preco.
     * @param codigoErp codigo do produto no sistema
     * @param preco preco enviado
     * @returns quantidade de linhas alteradas
     */
    async updatePreco(codigoErp: number, preco: number): Promise<number> {
        const sql = `UPDATE ${this.database}.produtos
                     SET preco = ?, ultimo_envio_preco = NOW()
                     WHERE codigo_erp = ?`
        const [result] = await this.connection.query(sql, [preco, codigoErp]) as ResultSetHeader[]

        return result.affectedRows
    }

    /**
     * Registra o envio para a Nuvemshop.
     * @param codigoErp codigo do produto no sistema
     * @param tipo 'estoque' | 'preco' | 'ambos' - qual ultimo_envio atualizar (default 'ambos')
     * @param ids ids devolvidos pela Nuvemshop (opcional, grava id_produto_nuvemshop / id_variante_nuvemshop)
     */
    async marcarUltimoEnvio(
        codigoErp: number,
        tipo: 'estoque' | 'preco' | 'ambos' = 'ambos',
        ids: IdsNuvemshop = {}
    ): Promise<number> {
        const sets: string[] = []
        const values: unknown[] = []

        if (tipo === 'estoque' || tipo === 'ambos') sets.push(`ultimo_envio_estoque = NOW()`)
        if (tipo === 'preco' || tipo === 'ambos') sets.push(`ultimo_envio_preco = NOW()`)

        if (ids.idProdutoNuvemshop) {
            sets.push(`id_produto_nuvemshop = ?`)
            values.push(ids.idProdutoNuvemshop)
        }

        if (ids.idVarianteNuvemshop) {
            sets.push(`id_variante_nuvemshop = ?`)
            values.push(ids.idVarianteNuvemshop)
        }

        if (sets.length === 0) return 0

        values.push(codigoErp)

        const sql = `UPDATE ${this.database}.produtos SET ${sets.join(', ')} WHERE codigo_erp = ?`
        const [result] = await this.connection.query(sql, values) as ResultSetHeader[]

        return result.affectedRows
    }

    /**
     * Remove o produto pelo codigo_erp.
     * @param codigoErp codigo do produto no sistema
     */
    async deleteByCodigoErp(codigoErp: number): Promise<number> {
        const sql = `DELETE FROM ${this.database}.produtos WHERE codigo_erp = ?`
        const [result] = await this.connection.query(sql, [codigoErp]) as ResultSetHeader[]

        return result.affectedRows
    }
}
