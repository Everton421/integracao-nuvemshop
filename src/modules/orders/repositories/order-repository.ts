
import mysql, { type ResultSetHeader } from 'mysql2/promise';
import { type cad_orca } from '../../../shared/interfaces/cad_orca.ts';
import { type pro_orca } from '../../../shared/interfaces/pro-orca.ts';
import { type par_orca } from '../../../shared/interfaces/par_orca.ts';

/** Filtros da tela de listagem de pedidos. */
export type OrderViewFilters = {
    search?: string
    dataInicio?: string
    dataFim?: string
}

/** Linha de pedido exibida na tela de listagem. */
export type OrderViewRow = {
    CODIGO: number
    COD_SITE: string
    NOME_CLIENTE: string
    TOTAL_GERAL: number
    DATA_PEDIDO: string
    SITUACAO: string | null
    CONTATO: string
}

export class OrderRepository{
        private connection: mysql.Pool;
        private databasePublic: string;
        private databaseVendas: string;

    constructor( connection:mysql.Pool, databasePublic: string, databaseVendas: string ){
        this.connection = connection;
        this.databasePublic =databasePublic;
        this.databaseVendas =databaseVendas;
    }

    async insertCadOrca(order: cad_orca ): Promise<ResultSetHeader> {

		const sql = `INSERT INTO ${this.databaseVendas}.cad_orca (status, COD_SITE,  cliente, total_produtos, desc_prod ,
		total_geral, data_pedido, valor_frete, situacao, data_cadastro, hora_cadastro, data_inicio, hora_inicio, vendedor, contato, observacoes, observacoes2, tipo,  NF_ENT_OS, RECEPTOR, VAL_PROD_MANIP, PERC_PROD_MANIP, 
				PERC_SERV_MANIP, REVISAO_COMPLETA, DESTACAR, TABELA, QTDE_PARCELAS, ALIQ_ISSQN, 
				OUTRAS_DESPESAS, PESO_LIQUIDO, BASE_ICMS_UF_DEST, FORMA_PAGAMENTO, TRANSPORTADORA, FRETE, QUANTIDADE, MIDIA , VALOR_FRETE_CIF  )
				VALUES (
					'${order.STATUS}',
                    '${order.COD_SITE}',
					'${order.CLIENTE}',
					 ${order.TOTAL_PRODUTOS},
					'${order.DESC_PROD}',
					'${order.TOTAL_GERAL}',
					'${order.DATA_PEDIDO}',
					'${order.VALOR_FRETE}',
					'${order.SITUACAO}',
					'${order.DATA_CADASTRO}',
					'${order.HORA_CADASTRO}',
					'${order.DATA_INICIO}',
					'${order.HORA_INICIO}',
					'${order.VENDEDOR}',
					'${order.CONTATO}',
					'${order.OBSERVACOES}',
					'${order.OBSERVACOES2}',
					'${order.TIPO}',
					'${order.NF_ENT_OS}',
					'${order.RECEPTOR}',
					'${order.VAL_PROD_MANIP}',
					'${order.PERC_PROD_MANIP}',
					'${order.PERC_SERV_MANIP}',
					'${order.REVISAO_COMPLETA}',
					'${order.DESTACAR}',
					'${order.TABELA}',
					'${order.QTDE_PARCELAS}',
					'${order.ALIQ_ISSQN}',
					'${order.OUTRAS_DESPESAS}',
					'${order.PESO_LIQUIDO}',
					'${order.BASE_ICMS_UF_DEST}',
					'${order.FORMA_PAGAMENTO}',
					'${order.TRANSPORTADORA}',
					'${order.FRETE}',
					'${order.QUANTIDADE}',
					'${order.MIDIA}',
				    '${order.VALOR_FRETE_CIF}' 
				 );     
			`
		const [rows] = await this.connection.query(sql);
		const resultInsert = rows as ResultSetHeader;
        return resultInsert
	}
 
    
        /**
         * 
         * @param products produtos do pedido a serem processados  
         * @param codigoPedido codigo do pedido
         * @returns 
         */
          async insertProOrca(products: pro_orca[], codigo_orcamento: number) {
    
            let i = 1;
            for (const prod of products) {
                const sql =
                    ` INSERT INTO ${this.databaseVendas }.pro_orca  SET
                    orcamento    = ? ,  
                    sequencia    = ? ,  
                    produto      = ? , 
                    grade        = ? , 
                    padronizado  = ? , 
                    complemento  = ? , 
                    unidade      = ? ,    
                    item_unid    = ? , 
                    just_ipi     = ? , 
                    just_icms    = ? , 
                    just_subst   = ? , 
                    quantidade   = ? , 
                    unitario     = ? , 
                    total_liq	 = ? ,
                    unit_orig    = ? ,
                    tabela       = ? , 
                    preco_tabela = ? , 
                    CUSTO_MEDIO  = ? , 
                    ULT_CUSTO    = ? , 
                    FRETE        = ? , 
                    ipi 	     = ? , 
                    desconto     = ?   
                `;
    
                const values = [
                    codigo_orcamento,
                    i,
                    prod.PRODUTO,
                    prod.GRADE,
                    prod.PADRONIZADO,
                    prod.COMPLEMENTO,
                    prod.UNIDADE,
                    prod.ITEM_UNID,
                    prod.JUST_IPI,
                    prod.JUST_ICMS,
                    prod.JUST_SUBST,
                    prod.QUANTIDADE,
                    prod.UNITARIO,
                    prod.TOTAL_LIQ,
                    prod.UNIT_ORIG,
                    prod.TABELA,
                    prod.PRECO_TABELA,
                    prod.CUSTO_MEDIO,
                    prod.ULT_CUSTO,
                    prod.FRETE,
                    prod.IPI,
                    prod.DESCONTO
                ]
    
                const [rows] = await this.connection.query(sql, values)
                const aux = rows as ResultSetHeader;
                if (aux.affectedRows > 0) console.log(`Produto registrado ${prod.PRODUTO}`)
                if (i == products.length) {
                    return;
                }
                i++;
    
            }
    
        }
    
          async deleteProOrca(erpCodeOrder: number): Promise<ResultSetHeader> {
            const sql = `
                    DELETE FROM ${this.databaseVendas}.pro_orca WHERE ORCAMENTO = ?;
                `
            const [rows] = await this.connection.query(sql, erpCodeOrder)
            return rows as ResultSetHeader;
        }
    
    /**
     * Monta o FROM/WHERE usado na listagem de pedidos (usado no SELECT e no COUNT).
     * Lista os pedidos que vieram da loja (COD_SITE preenchido) a partir do ERP.
     * @param filters filtros da tela de pedidos
     * @returns clausula FROM + WHERE e os valores do prepared statement
     */
    private buildOrdersForViewQuery(filters: OrderViewFilters): { from: string, where: string, values: any[] } {
        const conditions: string[] = []
        const values: any[] = []

        conditions.push(` COALESCE(co.COD_SITE, '') NOT IN ('', '0') `)

        if (filters.search) {
            const term = `%${filters.search}%`
            conditions.push(' ( CAST(co.CODIGO AS CHAR) LIKE ? OR co.COD_SITE LIKE ? OR cli.nome LIKE ? ) ')
            values.push(term, term, term)
        }

        if (filters.dataInicio) {
            conditions.push(' DATE(co.DATA_PEDIDO) >= ? ')
            values.push(filters.dataInicio)
        }

        if (filters.dataFim) {
            conditions.push(' DATE(co.DATA_PEDIDO) <= ? ')
            values.push(filters.dataFim)
        }

        const from = `
            FROM ${this.databaseVendas}.cad_orca co
            INNER JOIN ${this.databasePublic}.cad_clie cli ON cli.codigo = co.cliente
        `

        const where = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')} ` : ''

        return { from, where, values }
    }

    /**
     * Retorna uma pagina de pedidos para a tela de listagem.
     * @param filters filtros da tela
     * @param limit quantidade de registros da pagina
     * @param offset deslocamento da pagina
     * @returns OrderViewRow[]
     */
    async findOrdersForView(filters: OrderViewFilters = {}, limit = 25, offset = 0): Promise<OrderViewRow[]> {
        const { from, where, values } = this.buildOrdersForViewQuery(filters)

        const sql = `
            SELECT
                co.CODIGO,
                co.COD_SITE,
                cli.nome AS NOME_CLIENTE,
                co.TOTAL_GERAL,
                co.DATA_PEDIDO,
                co.SITUACAO,
                co.CONTATO
            ${from}
            ${where}
            ORDER BY co.CODIGO DESC
            LIMIT ? OFFSET ?
        `

        const [rows] = await this.connection.query(sql, [...values, limit, offset])
        return rows as OrderViewRow[]
    }

    /**
     * Conta o total de pedidos para os filtros informados (usado na paginacao).
     * @param filters filtros da tela
     * @returns total de registros
     */
    async countOrdersForView(filters: OrderViewFilters = {}): Promise<number> {
        const { from, where, values } = this.buildOrdersForViewQuery(filters)

        const sql = `SELECT COUNT(*) AS total ${from} ${where}`
        const [rows] = await this.connection.query(sql, values) as any

        return Number(rows[0]?.total ?? 0)
    }
          async delteParOrca(erpCodeOrder: number): Promise<ResultSetHeader> {
            const sql = `
                    DELETE FROM ${this.databaseVendas}.par_orca WHERE ORCAMENTO = ?;
                `
            const [rows] = await this.connection.query(sql, erpCodeOrder)
            return rows as ResultSetHeader;
        }
       
          async insertParOrca(installments: par_orca[], erpCodeOrder: any) {
            for (const installment of installments) {
                let i = 1;
    
                const sql =
                    ` INSERT INTO ${this.databaseVendas}.par_orca (orcamento, parcela, valor, vencimento, tipo_receb) VALUES 
                        (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?
                          );
                        `
                const values = [erpCodeOrder, i, installment.valor, installment.vencimento, installment.tipo_receb];
    
                await this.connection.query(sql, values)
                if (i === installments.length) {
                    return;
                }
                i++;
            }
        }

        async verifyExistsOrder( codeSite:string ){
            const sql = `SELECT CODIGO, DATA_RECAD FROM ${this.databaseVendas}.cad_orca WHERE COD_SITE = ?`;
                const [existsOrder] = await this.connection.query(sql, [ codeSite ]) as any;
            return existsOrder as { CODIGO:number, DATA_RECAD:string}[]
        }   

        async updateCadOrca(order: cad_orca ,erpCodeOrder:number): Promise<ResultSetHeader> {
        
        
                const baseSql = `UPDATE  ${this.databaseVendas}.cad_orca  
                            set   `
                const conditions = [];
                const values = [];
        
                if (order.STATUS) {
                    conditions.push(' STATUS = ? ');
                    values.push(`${order.STATUS}`);
                }
                if (order.CLIENTE) {
                    conditions.push(' CLIENTE = ? ');
                    values.push(`${order.CLIENTE}`);
                }
                if (order.TOTAL_PRODUTOS) {
                    conditions.push(' TOTAL_PRODUTOS = ? ');
                    values.push(`${order.TOTAL_PRODUTOS}`);
                }
                if (order.DESC_PROD) {
                    conditions.push(' DESC_PROD = ? ');
                    values.push(`${order.DESC_PROD}`);
                }
                if (order.TOTAL_GERAL) {
                    conditions.push(' TOTAL_GERAL = ? ');
                    values.push(`${order.TOTAL_GERAL}`);
                }
                if (order.DATA_PEDIDO) {
                    conditions.push(' DATA_PEDIDO = ? ');
                    values.push(`${order.DATA_PEDIDO}`);
                }
                if (order.VALOR_FRETE) {
                    conditions.push(' VALOR_FRETE = ? ');
                    values.push(`${order.VALOR_FRETE}`);
                }
                if (order.SITUACAO) {
                    conditions.push(' SITUACAO = ? ');
                    values.push(`${order.SITUACAO}`);
                }
                if (order.DATA_CADASTRO) {
                    conditions.push(' DATA_CADASTRO = ? ');
                    values.push(`${order.DATA_CADASTRO}`);
                }
                if (order.HORA_CADASTRO) {
                    conditions.push(' HORA_CADASTRO = ? ');
                    values.push(`${order.HORA_CADASTRO}`);
                }
                if (order.DATA_INICIO) {
                    conditions.push(' DATA_INICIO = ? ');
                    values.push(`${order.DATA_INICIO}`);
                }
                if (order.HORA_INICIO) {
                    conditions.push(' HORA_INICIO = ? ');
                    values.push(`${order.HORA_INICIO}`);
                }
                if (order.VENDEDOR) {
                    conditions.push(' VENDEDOR = ? ');
                    values.push(`${order.VENDEDOR}`);
                }
                if (order.CONTATO) {
                    conditions.push(' CONTATO = ? ');
                    values.push(`${order.CONTATO}`);
                }
                if (order.OBSERVACOES) {
                    conditions.push(' OBSERVACOES = ? ');
                    values.push(`${order.OBSERVACOES}`);
                }
                if (order.OBSERVACOES2) {
                    conditions.push(' OBSERVACOES2 = ? ');
                    values.push(`${order.OBSERVACOES2}`);
                }
                if (order.TIPO) {
                    conditions.push(' TIPO = ? ');
                    values.push(`${order.TIPO}`);
                }
                if (order.NF_ENT_OS) {
                    conditions.push(' NF_ENT_OS = ? ');
                    values.push(`${order.NF_ENT_OS}`);
                }
                if (order.RECEPTOR) {
                    conditions.push(' RECEPTOR = ? ');
                    values.push(`${order.RECEPTOR}`);
                }
                if (order.VAL_PROD_MANIP) {
                    conditions.push(' VAL_PROD_MANIP = ? ');
                    values.push(`${order.VAL_PROD_MANIP}`);
                }
                if (order.PERC_PROD_MANIP) {
                    conditions.push(' PERC_PROD_MANIP = ? ');
                    values.push(`${order.PERC_PROD_MANIP}`);
                }
                if (order.PERC_SERV_MANIP) {
                    conditions.push(' PERC_SERV_MANIP = ? ');
                    values.push(`${order.PERC_SERV_MANIP}`);
                }
                if (order.REVISAO_COMPLETA) {
                    conditions.push(' REVISAO_COMPLETA = ? ');
                    values.push(`${order.REVISAO_COMPLETA}`);
                }
                if (order.DESTACAR) {
                    conditions.push(' DESTACAR = ? ');
                    values.push(`${order.DESTACAR}`);
                }
                if (order.TABELA) {
                    conditions.push(' TABELA = ? ');
                    values.push(`${order.TABELA}`);
                }
                if (order.QTDE_PARCELAS) {
                    conditions.push(' QTDE_PARCELAS = ? ');
                    values.push(`${order.QTDE_PARCELAS}`);
                }
                if (order.ALIQ_ISSQN) {
                    conditions.push(' ALIQ_ISSQN = ? ');
                    values.push(`${order.ALIQ_ISSQN}`);
                }
                if (order.OUTRAS_DESPESAS) {
                    conditions.push(' OUTRAS_DESPESAS = ? ');
                    values.push(`${order.OUTRAS_DESPESAS}`);
                }
                if (order.PESO_LIQUIDO) {
                    conditions.push(' PESO_LIQUIDO = ? ');
                    values.push(`${order.PESO_LIQUIDO}`);
                }
                if (order.BASE_ICMS_UF_DEST) {
                    conditions.push(' BASE_ICMS_UF_DEST = ? ');
                    values.push(`${order.BASE_ICMS_UF_DEST}`);
                }
                if (order.FORMA_PAGAMENTO) {
                    conditions.push(' FORMA_PAGAMENTO = ? ');
                    values.push(`${order.FORMA_PAGAMENTO}`);
                }
        
                if (order.MIDIA) {
                    conditions.push(' MIDIA = ? ');
                    values.push(`${order.MIDIA}`);
                }
        
                const whereClause = ' WHERE CODIGO = ? '
                values.push(erpCodeOrder);
        
                const sql = baseSql + conditions.join(' , ') + whereClause;
        
        
                const [rows] = await this.connection.query(sql, values);
        
                const result = rows as ResultSetHeader;
                return result;
            }
            

}