


import mysql, { type ResultSetHeader } from 'mysql2/promise'

type typePhotoProductErp =
{
    CAMINHO_FOTO: string | null
    FOTO: string | null
    PRODUTO:number
    SEQ: number 
    DESCRICAO:string 
    LINK:string | null
    id:number 
}

export interface photosProductIntegration {
id: number
id_foto_nuvemshop:string
id_produto_nuvemshop:string
src:string | null 
posicao:number
hash:string | null
nome_arquivo:string | null
codigo_produto_erp:number
id_foto_erp:number
created_at:string
updated_at:string
}

/** Resultado padrao dos inserts: os services checam `sucess` */
export interface ResultadoInsert {
    sucess: boolean
    insertId: number
    mensagem?: string
}

const COLUNAS_FOTOS = [
    'id', 'id_foto_nuvemshop', 'id_produto_nuvemshop', 'src', 'posicao',
    'hash', 'nome_arquivo', 'codigo_produto_erp', 'id_foto_erp',
    'created_at', 'updated_at'
] as const

const COLUNAS_GRAVAVEIS_FOTOS = [
    'id_foto_nuvemshop', 'id_produto_nuvemshop', 'src', 'posicao',
    'hash', 'nome_arquivo', 'codigo_produto_erp', 'id_foto_erp'
] as const

/**
 * Monta o WHERE dinamico a partir de um mapa coluna -> valor.
 * Colunas que nao estao na lista sao ignoradas (protecao contra SQL injetado no nome da coluna).
 */
function montarWhereFotos(
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

export class PhotosRepository {
    private databasePublico:string ; 
    private databaseVendas:string ; 
    private connection: mysql.Pool;
    private databaseIntegration: string;

    constructor( connection:mysql.Pool, databasePublico:string, databaseIntegration: string, databaseVendas:string){
        this.connection = connection
        this.databasePublico= databasePublico
        this.databaseVendas= databaseVendas
        this.databaseIntegration = databaseIntegration
    }


    async findPhotosProductbyParams( query: { product?:number, photoId?:number,sequency?:number }){
        const { photoId, product, sequency } = query;
      const baseSql =    `SELECT  
                            CONCAT( 
                            CAST(p.FOTOS  AS CHAR(1000)  CHARACTER SET latin1),
                            CAST(fp.FOTO  AS CHAR(1000)  CHARACTER SET latin1)  
                            ) as CAMINHO_FOTO ,
                            CAST(fp.FOTO  AS CHAR(1000)  CHARACTER SET latin1) as FOTO,
                            fp.PRODUTO,
                            fp.SEQ,
                            fp.DESCRICAO,
                            fp.LINK,
                            fp.id
                        FROM  ${this.databasePublico}.fotos_prod fp 
                        JOIN  ${this.databaseVendas}.parametros p on p.id = 1
                  ` 
                const conditions=[];
                const values=[]
                if(photoId){
                    conditions.push(` fp.id = ? `)
                    values.push(photoId)
                }
                if(product){
                    conditions.push(` fp.PRODUTO = ? `)
                    values.push(product)
                }
                if(sequency){
                    conditions.push(` fp.SEQ = ? `)
                    values.push(sequency)
                }

                        const whereClause = ` WHERE `;
                        const finalSql = baseSql + whereClause + conditions.join(' AND ');

           const [ data ] = await this.connection.query(finalSql, values);
         return data as typePhotoProductErp[]
    }

    /** -----------------------------------------------------------------
     * Métodos sobre a tabela ${this.databaseIntegration}.fotos_produtos -
     * registra as fotos efetivamente enviadas para a Nuvemshop.
     * ----------------------------------------------------------------- */

    /**
     * Foto enviada pelo id interno da tabela.
     * @param id id da tabela fotos_produtos
     */
    async findById(id: number): Promise<photosProductIntegration[]> {
        const sql = `SELECT * FROM ${this.databaseIntegration}.fotos_produtos WHERE id = ?`
        const [ rows ] = await this.connection.query(sql, [id])

        return rows as photosProductIntegration[]
    }

    /**
     * Fotos ja enviadas de um produto ERP.
     * @param codigoProdutoErp codigo do produto no sistema
     */
    async findByCodigoProdutoErp(codigoProdutoErp: number): Promise<photosProductIntegration[]> {
        const sql = `SELECT * FROM ${this.databaseIntegration}.fotos_produtos
                     WHERE codigo_produto_erp = ?
                     ORDER BY posicao ASC`
        const [ rows ] = await this.connection.query(sql, [codigoProdutoErp])

        return rows as photosProductIntegration[]
    }

    /**
     * Foto enviada pelo id da foto na Nuvemshop.
     * @param idFotoNuvemshop id da foto na Nuvemshop
     */
    async findByFotoNuvemshop(idFotoNuvemshop: string): Promise<photosProductIntegration[]> {
        const sql = `SELECT * FROM ${this.databaseIntegration}.fotos_produtos
                     WHERE id_foto_nuvemshop = ?`
        const [ rows ] = await this.connection.query(sql, [idFotoNuvemshop])

        return rows as photosProductIntegration[]
    }

    /**
     * Busca fotos por qualquer combinacao de colunas.
     * Colunas desconhecidas sao ignoradas. Ex.: findPhotosByParam({ codigo_produto_erp: 10 })
     * @param params mapa coluna -> valor
     */
    async findPhotosByParam(params: Record<string, unknown>): Promise<photosProductIntegration[]> {
        const { where, values } = montarWhereFotos(params, COLUNAS_FOTOS)

        const sql = `SELECT * FROM ${this.databaseIntegration}.fotos_produtos` +
            (where ? ` WHERE ${where}` : '') +
            ` ORDER BY posicao ASC`

        const [ rows ] = await this.connection.query(sql, values)

        return rows as photosProductIntegration[]
    }

    /**
     * Registra uma foto enviada para a Nuvemshop.
     * @param input dados da foto (codigo_produto_erp obrigatorio)
     */
    async inserir(input: Partial<photosProductIntegration> & { codigo_produto_erp: number }): Promise<ResultadoInsert> {
        const colunas: string[] = []
        const values: unknown[] = []

        for (const [coluna, valor] of Object.entries(input)) {
            if (valor === undefined) continue
            if (!COLUNAS_FOTOS.includes(coluna as any)) continue

            colunas.push(coluna)
            values.push(valor)
        }

        if (colunas.length === 0) {
            return { sucess: false, insertId: 0, mensagem: 'Nenhum campo valido para inserir.' }
        }

        const sql = `INSERT INTO ${this.databaseIntegration}.fotos_produtos (${colunas.join(', ')})
                     VALUES (${colunas.map(() => '?').join(', ')})`

        try {
            const [ result ] = await this.connection.query(sql, values) as ResultSetHeader[]

            return { sucess: result.affectedRows > 0, insertId: result.insertId }
        } catch (e: any) {
            if (e?.code === 'ER_DUP_ENTRY') {
                return { sucess: false, insertId: 0, mensagem: `Foto do produto ${input.codigo_produto_erp} ja cadastrada.` }
            }
            throw e
        }
    }

    /**
     * Atualiza campos da foto enviada pelo id interno.
     * @param id id da tabela fotos_produtos
     * @param input campos a atualizar (somente colunas gravaveis sao aceitas)
     * @returns quantidade de linhas alteradas
     */
    async update(id: number, input: Partial<photosProductIntegration>): Promise<number> {
        const sets: string[] = []
        const values: unknown[] = []

        for (const [coluna, valor] of Object.entries(input)) {
            if (valor === undefined) continue
            if (!COLUNAS_GRAVAVEIS_FOTOS.includes(coluna as any)) continue

            sets.push(`${coluna} = ?`)
            values.push(valor)
        }

        if (sets.length === 0) return 0

        values.push(id)

        const sql = `UPDATE ${this.databaseIntegration}.fotos_produtos SET ${sets.join(', ')} WHERE id = ?`
        const [ result ] = await this.connection.query(sql, values) as ResultSetHeader[]

        return result.affectedRows
    }

    /**
     * Remove a foto enviada pelo id interno.
     * @param id id da tabela fotos_produtos
     */
    async deleteById(id: number): Promise<number> {
        const sql = `DELETE FROM ${this.databaseIntegration}.fotos_produtos WHERE id = ?`
        const [ result ] = await this.connection.query(sql, [id]) as ResultSetHeader[]

        return result.affectedRows
    }

    /**
     * Remove todas as fotos enviadas de um produto (ex.: para reenvio).
     * @param codigoProdutoErp codigo do produto no sistema
     */
    async deleteByCodigoProdutoErp(codigoProdutoErp: number): Promise<number> {
        const sql = `DELETE FROM ${this.databaseIntegration}.fotos_produtos WHERE codigo_produto_erp = ?`
        const [ result ] = await this.connection.query(sql, [codigoProdutoErp]) as ResultSetHeader[]

        return result.affectedRows
    }
 
    /**
     * Exclui a foto pelo id da foto na nuvenshop
     * @param nuvemShopPhotoId 
     * @returns 
     */
    async deleteByIdNuvemShop(nuvemShopPhotoId: number): Promise<number> {
        const sql = `DELETE FROM ${this.databaseIntegration}.fotos_produtos WHERE id_foto_nuvemshop = ?`
        const [ result ] = await this.connection.query(sql, [nuvemShopPhotoId]) as ResultSetHeader[]

        return result.affectedRows
    }
    
}