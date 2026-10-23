import mysql from 'mysql2/promise';
import { type cad_pgru } from "../../../shared/interfaces/cad_pgru.ts";
import { type subgrupos } from '../../../shared/interfaces/subgrupos.ts';

export type CategoryViewFilters = {
    search?: string
    syncStatus?: 'synced' | 'not_synced'
    nivel?: 'grupo' | 'subgrupo'
    disponivel?: 'S' | 'N'
}

export type CategoryViewRow = {
    codigo: number
    nome: string
    nivel: 'grupo' | 'subgrupo'
    codigo_grupo_pai: number | null
    ativo: 'S' | 'N'
    no_site: 'S' | 'N'
    id: number | null
    id_nuvemshop: string | null
    ultimo_envio: string | null
}

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

    async findAllCategories(NO_SITE : "S" | "N" = 'S'){
        const sql = ` SELECT * 
                  FROM ${this.databasePublico}.cad_pgru  
                    WHERE NO_SITE = ?
            ;`;
        
        const [rows] = await this.connection.query( sql,NO_SITE );
            return rows as  cad_pgru[];
    }
    async findAllSubcategories(NO_SITE : "S" | "N" = 'S'){
        const sql = ` SELECT * 
                  FROM ${this.databasePublico}.subgrupos  
                    WHERE NO_SITE = ?
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

    /**
     * Monta a subquery (UNION ALL de grupos + subcategorias) usada na listagem
     * da tela de categorias, com o status de envio vindo da tabela de integracao.
     * @returns clausula FROM contendo a derived table
     */
    private buildCategoriesUnion(): string {
        return `
            (
                SELECT
                    cg.CODIGO AS codigo,
                    cg.NOME AS nome,
                    'grupo' AS nivel,
                    NULL AS codigo_grupo_pai,
                    cg.ATIVO AS ativo,
                    cg.NO_SITE AS no_site,
                    ci.id AS id,
                    ci.id_nuvemshop AS id_nuvemshop,
                    ci.ultimo_envio AS ultimo_envio
                FROM ${this.databasePublico}.cad_pgru cg
                LEFT JOIN ${this.databaseIntegration}.categorias ci
                       ON ci.nivel = 'grupo' AND ci.codigo_erp = cg.CODIGO
                UNION ALL
                SELECT
                    sg.CODIGO,
                    sg.DESCRICAO,
                    'subgrupo',
                    sg.COD_GRUPO,
                    'S',
                    sg.NO_SITE,
                    ci.id,
                    ci.id_nuvemshop,
                    ci.ultimo_envio
                FROM ${this.databasePublico}.subgrupos sg
                LEFT JOIN ${this.databaseIntegration}.categorias ci
                       ON ci.nivel = 'subgrupo' AND ci.codigo_erp = sg.CODIGO
            ) t
        `
    }

    /**
     * Monta o WHERE usado na listagem de categorias (usado no SELECT e no COUNT).
     * @param filters filtros da tela de categorias
     * @returns clausula WHERE + os valores do prepared statement
     */
    private buildCategoriesForViewQuery(filters: CategoryViewFilters): { where: string, values: any[] } {
        const conditions: string[] = []
        const values: any[] = []

        if (filters.search) {
            const term = `%${filters.search}%`
            conditions.push(' ( CAST(t.codigo AS CHAR) LIKE ? OR t.nome LIKE ? ) ')
            values.push(term, term)
        }

        if (filters.syncStatus === 'synced') {
            conditions.push(' t.id IS NOT NULL ')
        } else if (filters.syncStatus === 'not_synced') {
            conditions.push(' t.id IS NULL ')
        }

        if (filters.nivel) {
            conditions.push(' t.nivel = ? ')
            values.push(filters.nivel)
        }

        // por padrao lista apenas as categorias disponiveis para envio (ATIVO='S' e NO_SITE='S').
        if (filters.disponivel !== 'N') {
            conditions.push(` t.ativo = 'S' AND t.no_site = 'S' `)
        }

        const where = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')} ` : ''

        return { where, values }
    }

    /**
     * Retorna uma pagina de categorias (grupos + subcategorias) para a tela de listagem.
     * @param filters filtros da tela
     * @param limit quantidade de registros da pagina
     * @param offset deslocamento da pagina
     * @returns CategoryViewRow[]
     */
    async findCategoriesForView(filters: CategoryViewFilters = {}, limit = 50, offset = 0): Promise<CategoryViewRow[]> {
        const { where, values } = this.buildCategoriesForViewQuery(filters)

        const sql = `
            SELECT
                t.codigo,
                t.nome,
                t.nivel,
                t.codigo_grupo_pai,
                t.ativo,
                t.no_site,
                t.id,
                t.id_nuvemshop,
                t.ultimo_envio
            FROM ${this.buildCategoriesUnion()}
            ${where}
            ORDER BY t.nivel, t.codigo
            LIMIT ? OFFSET ?
        `

        const [rows] = await this.connection.query(sql, [...values, limit, offset])
        return rows as CategoryViewRow[]
    }

    /**
     * Conta o total de categorias para os filtros informados (usado na paginacao).
     * @param filters filtros da tela
     * @returns total de registros
     */
    async countCategoriesForView(filters: CategoryViewFilters = {}): Promise<number> {
        const { where, values } = this.buildCategoriesForViewQuery(filters)

        const sql = `SELECT COUNT(*) AS total FROM ${this.buildCategoriesUnion()} ${where}`
        const [rows] = await this.connection.query(sql, values) as any

        return Number(rows[0]?.total ?? 0)
    }

}