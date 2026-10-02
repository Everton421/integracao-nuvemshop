import { type ResultSetHeader } from "mysql2";
import { conn2, database_api, db_publico, db_vendas } from "../../../database/database-connection.ts";
import { type cad_orca } from "../../../shared/interfaces/cad_orca.ts";
import { type par_orca } from "../../../shared/interfaces/par_orca.ts";
import { type pro_orca } from "../../../shared/interfaces/pro-orca.ts";



type updatePedido = Partial<cad_orca> & { CODIGO: number }
type pedidosFaturados = [{ shopify_order_id: string, CHAVE_NFE: string, NUMERO_NF: number, id: number, shopifyFulfillmentOrderId: string | null, delivery_method_id: number | null, id_pedido_entrega: string | null }];

type resultTransp = { 
	COD_TRANSP_INTERSIG:number
}


type produtoPedidoFaturado = {
				PRODUTO:number,
				QUANTIDADE:number,
				PESO:number,
				COMPRIMENTO:number,
				LARGURA:number,
				ALTURA:number
				DESCRICAO: string
				TOTAL:number
}
export class PedidoRepository {

	private database = `\`${database_api}\``

	/**
	 * 
	 * @param produtos produtos do pedido a serem processados  
	 * @param codigoPedido codigo do pedido
	 * @returns 
	 */
	static async cadastraProdutosDoPedido(produtos: pro_orca[], codigo_orcamento: number) {

		let i = 1;
		for (const prod of produtos) {
			const sql =
				` INSERT INTO ${db_vendas}.pro_orca  SET
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

			const [rows] = await conn2.query(sql, values)
			const aux = rows as ResultSetHeader;
			if (aux.affectedRows > 0) console.log(`Produto registrado ${prod.PRODUTO}`)
			if (i == produtos.length) {
				return;
			}
			i++;

		}

	}

	static async deleteProdutosPedido(codigoPedido: number): Promise<ResultSetHeader> {
		const sql = `
				DELETE FROM ${db_vendas}.pro_orca WHERE ORCAMENTO = ?;
			`
		const [rows] = await conn2.query(sql, codigoPedido)
		return rows as ResultSetHeader;
	}


	static async deleteParcelasPedido(codigoPedido: number): Promise<ResultSetHeader> {
		const sql = `
				DELETE FROM ${db_vendas}.par_orca WHERE ORCAMENTO = ?;
			`
		const [rows] = await conn2.query(sql, codigoPedido)
		return rows as ResultSetHeader;
	}
	/**
	 * 
	 * @param parcelas array com as parcelas a serem processadas
	 * @param codigoPedido codigo do pedido 
	 * @returns 
	 */
	static async cadastraParcelasDoPedido(parcelas: par_orca[], codigoPedido: any) {
		for (const parcela of parcelas) {
			let i = 1;

			const sql =
				` INSERT INTO ${db_vendas}.par_orca (orcamento, parcela, valor, vencimento, tipo_receb) VALUES 
					(
				 	?,
				 	?,
				 	?,
					?,
					?
					  );
					`
			const values = [codigoPedido, i, parcela.valor, parcela.vencimento, parcela.tipo_receb];

			await conn2.query(sql, values)
			if (i === parcelas.length) {
				return;
			}
			i++;
		}
	}

	/**
	 * 
	 * @param pedido pedido a ser registrado nas tabelas do sistema
	 * @param cliente codigo do cliente 
	 * @param vendedor codigo do vendedor
	 * @returns 
	 */
	static async cadastrarPedido(pedido: cad_orca, produtos: pro_orca[], parcelas: par_orca[], fulfillmentOrderId:string, shpifyOrderId:string): Promise<ResultSetHeader> {

		let totalProdutos = 0; // Inicializando a variável totalProdutos

		produtos.forEach((i) => {
			totalProdutos += (i.UNITARIO * i.QUANTIDADE); // - iten.desconto;
		});

		let codigoPedido: number;


		const sql = `INSERT INTO ${db_vendas}.cad_orca (status,  cliente, total_produtos, desc_prod ,
		total_geral, data_pedido, valor_frete, situacao, data_cadastro, hora_cadastro, data_inicio, hora_inicio, vendedor, contato, observacoes, observacoes2, tipo,  NF_ENT_OS, RECEPTOR, VAL_PROD_MANIP, PERC_PROD_MANIP, 
				PERC_SERV_MANIP, REVISAO_COMPLETA, DESTACAR, TABELA, QTDE_PARCELAS, ALIQ_ISSQN, 
				OUTRAS_DESPESAS, PESO_LIQUIDO, BASE_ICMS_UF_DEST, FORMA_PAGAMENTO, TRANSPORTADORA, FRETE, QUANTIDADE, MIDIA , VALOR_FRETE_CIF ,FULLFILMENT_ORDER_ID,SHOPIFY_ORDER_ID )
				VALUES (
					'${pedido.STATUS}',
					'${pedido.CLIENTE}',
					 ${pedido.TOTAL_PRODUTOS},
					'${pedido.DESC_PROD}',
					'${pedido.TOTAL_GERAL}',
					'${pedido.DATA_PEDIDO}',
					'${pedido.VALOR_FRETE}',
					'${pedido.SITUACAO}',
					'${pedido.DATA_CADASTRO}',
					'${pedido.HORA_CADASTRO}',
					'${pedido.DATA_INICIO}',
					'${pedido.HORA_INICIO}',
					'${pedido.VENDEDOR}',
					'${pedido.CONTATO}',
					'${pedido.OBSERVACOES}',
					'${pedido.OBSERVACOES2}',
					'${pedido.TIPO}',
					'${pedido.NF_ENT_OS}',
					'${pedido.RECEPTOR}',
					'${pedido.VAL_PROD_MANIP}',
					'${pedido.PERC_PROD_MANIP}',
					'${pedido.PERC_SERV_MANIP}',
					'${pedido.REVISAO_COMPLETA}',
					'${pedido.DESTACAR}',
					'${pedido.TABELA}',
					'${pedido.QTDE_PARCELAS}',
					'${pedido.ALIQ_ISSQN}',
					'${pedido.OUTRAS_DESPESAS}',
					'${pedido.PESO_LIQUIDO}',
					'${pedido.BASE_ICMS_UF_DEST}',
					'${pedido.FORMA_PAGAMENTO}',
					'${pedido.TRANSPORTADORA}',
					'${pedido.FRETE}',
					'${pedido.QUANTIDADE}',
					'${pedido.MIDIA}',
				     '${pedido.VALOR_FRETE_CIF}',
					'${fulfillmentOrderId}',
					'${shpifyOrderId}'
				 );     
			`
		const [rows] = await conn2.query(sql);
		const resultInsert = rows as ResultSetHeader;
		codigoPedido = resultInsert.insertId;

		if (produtos.length > 0) {
			try {
				await this.cadastraProdutosDoPedido(produtos, codigoPedido)
			} catch (err) {
				console.log(err)

				throw  err
			}
		}
		if (parcelas.length > 0) {
			try {
				await this.cadastraParcelasDoPedido(parcelas, codigoPedido)

			} catch (err) {
				console.log(err)
				throw  err
			}
		}

		return resultInsert;
	}

	/**
	 * obtem todas as informações do pedido contidas na tabela cad_orca 
	 * @param codigo codigo do pedido 
	 * @returns 
	 */
	static async findByCode(codigo: number): Promise<cad_orca[]> {

		const sql = `SELECT * FROM ${db_vendas}.cad_orca WHERE CODIGO = ?`;

		const [rows] = await conn2.query(sql, codigo)
		return rows as cad_orca[];

	}


	static async atualizarpedido(pedido: updatePedido, produtos: pro_orca[], parcelas: par_orca[]): Promise<ResultSetHeader> {

		let totalProdutos = 0; // Inicializando a variável totalProdutos

		produtos.forEach((i) => {
			totalProdutos += (i.UNITARIO * i.QUANTIDADE); // - iten.desconto;
		});

		let codigoPedido: number;

		const baseSql = `UPDATE  ${db_vendas}.cad_orca  
					set   `
		const conditions = [];
		const values = [];

		if (pedido.STATUS) {
			conditions.push(' STATUS = ? ');
			values.push(`${pedido.STATUS}`);
		}
		if (pedido.CLIENTE) {
			conditions.push(' CLIENTE = ? ');
			values.push(`${pedido.CLIENTE}`);
		}
		if (pedido.TOTAL_PRODUTOS) {
			conditions.push(' TOTAL_PRODUTOS = ? ');
			values.push(`${pedido.TOTAL_PRODUTOS}`);
		}
		if (pedido.DESC_PROD) {
			conditions.push(' DESC_PROD = ? ');
			values.push(`${pedido.DESC_PROD}`);
		}
		if (pedido.TOTAL_GERAL) {
			conditions.push(' TOTAL_GERAL = ? ');
			values.push(`${pedido.TOTAL_GERAL}`);
		}
		if (pedido.DATA_PEDIDO) {
			conditions.push(' DATA_PEDIDO = ? ');
			values.push(`${pedido.DATA_PEDIDO}`);
		}
		if (pedido.VALOR_FRETE) {
			conditions.push(' VALOR_FRETE = ? ');
			values.push(`${pedido.VALOR_FRETE}`);
		}
		if (pedido.SITUACAO) {
			conditions.push(' SITUACAO = ? ');
			values.push(`${pedido.SITUACAO}`);
		}
		if (pedido.DATA_CADASTRO) {
			conditions.push(' DATA_CADASTRO = ? ');
			values.push(`${pedido.DATA_CADASTRO}`);
		}
		if (pedido.HORA_CADASTRO) {
			conditions.push(' HORA_CADASTRO = ? ');
			values.push(`${pedido.HORA_CADASTRO}`);
		}
		if (pedido.DATA_INICIO) {
			conditions.push(' DATA_INICIO = ? ');
			values.push(`${pedido.DATA_INICIO}`);
		}
		if (pedido.HORA_INICIO) {
			conditions.push(' HORA_INICIO = ? ');
			values.push(`${pedido.HORA_INICIO}`);
		}
		if (pedido.VENDEDOR) {
			conditions.push(' VENDEDOR = ? ');
			values.push(`${pedido.VENDEDOR}`);
		}
		if (pedido.CONTATO) {
			conditions.push(' CONTATO = ? ');
			values.push(`${pedido.CONTATO}`);
		}
		if (pedido.OBSERVACOES) {
			conditions.push(' OBSERVACOES = ? ');
			values.push(`${pedido.OBSERVACOES}`);
		}
		if (pedido.OBSERVACOES2) {
			conditions.push(' OBSERVACOES2 = ? ');
			values.push(`${pedido.OBSERVACOES2}`);
		}
		if (pedido.TIPO) {
			conditions.push(' TIPO = ? ');
			values.push(`${pedido.TIPO}`);
		}
		if (pedido.NF_ENT_OS) {
			conditions.push(' NF_ENT_OS = ? ');
			values.push(`${pedido.NF_ENT_OS}`);
		}
		if (pedido.RECEPTOR) {
			conditions.push(' RECEPTOR = ? ');
			values.push(`${pedido.RECEPTOR}`);
		}
		if (pedido.VAL_PROD_MANIP) {
			conditions.push(' VAL_PROD_MANIP = ? ');
			values.push(`${pedido.VAL_PROD_MANIP}`);
		}
		if (pedido.PERC_PROD_MANIP) {
			conditions.push(' PERC_PROD_MANIP = ? ');
			values.push(`${pedido.PERC_PROD_MANIP}`);
		}
		if (pedido.PERC_SERV_MANIP) {
			conditions.push(' PERC_SERV_MANIP = ? ');
			values.push(`${pedido.PERC_SERV_MANIP}`);
		}
		if (pedido.REVISAO_COMPLETA) {
			conditions.push(' REVISAO_COMPLETA = ? ');
			values.push(`${pedido.REVISAO_COMPLETA}`);
		}
		if (pedido.DESTACAR) {
			conditions.push(' DESTACAR = ? ');
			values.push(`${pedido.DESTACAR}`);
		}
		if (pedido.TABELA) {
			conditions.push(' TABELA = ? ');
			values.push(`${pedido.TABELA}`);
		}
		if (pedido.QTDE_PARCELAS) {
			conditions.push(' QTDE_PARCELAS = ? ');
			values.push(`${pedido.QTDE_PARCELAS}`);
		}
		if (pedido.ALIQ_ISSQN) {
			conditions.push(' ALIQ_ISSQN = ? ');
			values.push(`${pedido.ALIQ_ISSQN}`);
		}
		if (pedido.OUTRAS_DESPESAS) {
			conditions.push(' OUTRAS_DESPESAS = ? ');
			values.push(`${pedido.OUTRAS_DESPESAS}`);
		}
		if (pedido.PESO_LIQUIDO) {
			conditions.push(' PESO_LIQUIDO = ? ');
			values.push(`${pedido.PESO_LIQUIDO}`);
		}
		if (pedido.BASE_ICMS_UF_DEST) {
			conditions.push(' BASE_ICMS_UF_DEST = ? ');
			values.push(`${pedido.BASE_ICMS_UF_DEST}`);
		}
		if (pedido.FORMA_PAGAMENTO) {
			conditions.push(' FORMA_PAGAMENTO = ? ');
			values.push(`${pedido.FORMA_PAGAMENTO}`);
		}

		if (pedido.MIDIA) {
			conditions.push(' MIDIA = ? ');
			values.push(`${pedido.MIDIA}`);
		}

		const whereClause = ' WHERE CODIGO = ? '
		values.push(pedido.CODIGO);

		const sql = baseSql + conditions.join(' , ') + whereClause;


		const [rows] = await conn2.query(sql, values);

		const result = rows as ResultSetHeader;
		try {
			const auxDelete = await this.deleteProdutosPedido(pedido.CODIGO);
			//if(auxDelete.affectedRows > 0 ) console.log("Produtos excluidos...")
			const auxInsert = await this.cadastraProdutosDoPedido(produtos, pedido.CODIGO)

		} catch (err) {
			console.log(err)
		}

		try {
			await this.deleteParcelasPedido(pedido.CODIGO);
			await this.cadastraParcelasDoPedido(parcelas, pedido.CODIGO);

		} catch (err) {
			console.log(err)
		}

		return result;
	}


	static 	async pedidosFaturados(codigo?: number): Promise<pedidosFaturados> {
		
		const obj = new PedidoRepository();
		 
		const baseSql = `
	  SELECT 
	    P.shopify_order_id,
		P.id,

		NF.CHAVE_NFE,
	    NF.NUMERO_NF,
		NF.VALOR_FRETE,

		CO.CODIGO AS CODIGO_PEDIDO_ERP,

		CLI.NOME,
		CLI.CEP,
		CLI.EMAIL,
		CLI.ENDERECO,
        CLI.NUMERO,
        CLI.COMPLEMENTO,
        CLI.BAIRRO,
        CLI.CIDADE,
        CLI.ESTADO,
        CLI.TELEFONE_RES,
		CLI.CELULAR,
		P.shopifyFulfillmentOrderId,
		P.delivery_method_id,
		P.id_pedido_entrega

		from
		 ${obj.database}.pedidos P 
				JOIN ${db_vendas}.cad_orca CO ON P.erp_order_id = CO.CODIGO  
				JOIN ${db_vendas}.cad_nf NF  on NF.PEDIDO = CO.CODIGO 
				JOIN ${db_publico}.cad_clie CLI on CLI.CODIGO = NF.CODIGO_CLI_FOR 
				`;


        let whereClause = `where 
                    NF.CHAVE_NFE <> '' 
                        AND NF.CHAVE_NFE IS NOT NULL 
                        AND NF.SITUACAO_NFE ='A'
                AND P.status_atendimento ='UNFULFILLED'
                AND (P.delivery_method_id IS NULL OR P.delivery_method_id = 0)
                AND (P.deliveryMethod IS NULL OR P.deliveryMethod != 'PICKUP')
                 GROUP BY P.id `

        if (codigo) {
            whereClause = `where 
                    NF.CHAVE_NFE <> ''  
                        AND NF.CHAVE_NFE IS NOT NULL 
                        AND NF.SITUACAO_NFE ='A'
                AND P.status_atendimento ='UNFULFILLED' 
                AND (P.delivery_method_id IS NULL OR P.delivery_method_id = 0)
                AND (P.deliveryMethod IS NULL OR P.deliveryMethod != 'PICKUP')
                AND CO.CODIGO = ${codigo}
                 GROUP BY P.id `
        }

		const sql = baseSql + whereClause
		console.log(sql);

		const [rows] = await conn2.query(sql);
		return rows as pedidosFaturados

	}

	static async findOrdersUNFULFILLED(){
		
		const obj = new PedidoRepository();

		const baseSql = `
	  SELECT
	    P.shopify_order_id,
		P.id,
		NF.CHAVE_NFE,
	    NF.NUMERO_NF,
		CO.CODIGO AS CODIGO_PEDIDO_ERP,
		  P.shopify_order_number,
   		 P.deliveryMethod
		from
		 ${obj.database}.pedidos P
				JOIN ${db_vendas}.cad_orca CO ON P.erp_order_id = CO.CODIGO
				JOIN ${db_vendas}.cad_nf NF  on NF.PEDIDO = CO.CODIGO
				`;

		let whereClause = `where
				    NF.CHAVE_NFE <> ''
						AND NF.CHAVE_NFE IS NOT NULL
						AND NF.SITUACAO_NFE ='A'
				AND P.status_atendimento ='UNFULFILLED'
			 
				 GROUP BY P.id `

		const sql = baseSql + whereClause
		const [rows] = await conn2.query(sql);
		return rows as {shopify_order_number:string, deliveryMethod:string, shopify_order_id: string, id: number, CHAVE_NFE: string, NUMERO_NF: number, CODIGO_PEDIDO_ERP: number }[]
	}
	 

	static async pedidosRetirada(codigo?: number): Promise<{ shopify_order_id: string, id: number, CHAVE_NFE: string, NUMERO_NF: number, CODIGO_PEDIDO_ERP: number }[]> {

		const obj = new PedidoRepository();

		const baseSql = `
	  SELECT
	    P.shopify_order_id,
		P.id,
		NF.CHAVE_NFE,
	    NF.NUMERO_NF,
		CO.CODIGO AS CODIGO_PEDIDO_ERP
		from
		 ${obj.database}.pedidos P
				JOIN ${db_vendas}.cad_orca CO ON P.erp_order_id = CO.CODIGO
				JOIN ${db_vendas}.cad_nf NF  on NF.PEDIDO = CO.CODIGO
				`;

		let whereClause = `where
				    NF.CHAVE_NFE <> ''
						AND NF.CHAVE_NFE IS NOT NULL
						AND NF.SITUACAO_NFE ='A'
				AND P.status_atendimento ='UNFULFILLED'
				AND P.deliveryMethod = 'PICKUP'
				 GROUP BY P.id `

		if (codigo) {
			whereClause = `where
				    NF.CHAVE_NFE <> ''
						AND NF.CHAVE_NFE IS NOT NULL
						AND NF.SITUACAO_NFE ='A'
				AND P.status_atendimento ='UNFULFILLED'
				AND 
		( P.deliveryMethod = 'PICKUP' OR P.deliveryMethod = 'PICK_UP )
				AND CO.CODIGO = ${codigo}
				 GROUP BY P.id `
		}

		const sql = baseSql + whereClause

		const [rows] = await conn2.query(sql);
		return rows as { shopify_order_id: string, id: number, CHAVE_NFE: string, NUMERO_NF: number, CODIGO_PEDIDO_ERP: number }[]

	}

	static async produtosPedidoFaturado(codigoPedido: number):Promise<produtoPedidoFaturado[]> {
		const sql = `
			SELECT 
				po.PRODUTO,
				po.QUANTIDADE,
				cp.PESO,
				cp.COMPRIMENTO,
				cp.LARGURA,
				cp.ALTURA,
				cp.DESCRICAO,
				po.TOTAL_LIQ TOTAL

			FROM ${db_vendas}.pro_orca po
			JOIN ${db_publico}.cad_prod cp ON cp.CODIGO = po.PRODUTO
			WHERE po.ORCAMENTO = ?
		`
		const [rows] = await conn2.query(sql, [codigoPedido])
		return rows as any[]
	}

	/**
	 * 
	 * @param codigoPedidoErp 
	 * @param status 
	 */
	static async updateStatusErpOrder(codigoPedidoErp:number , status: 'EA' | 'RE' | 'FI'){
		const sql= ` UPDATE ${db_vendas}.cad_orca set SITUACAO = '${status}' WHERE  CODIGO = '${codigoPedidoErp}' ;`
 		const [result] = await conn2.query(sql)
 
 		return result as ResultSetHeader;

	}

	/**
	 * 	Retorna o codigo da transportadora com base no cep da filial e do codigo da transportador do intelipost
	 * @param codigoTransportadoraIntelipost Codigo da transportadora que o usuario seleciona no site, é o mesmo que esta na tabela transp_frete
	 * @param cep_filial_pedido cep da filial que foi feito o pedido. 
	 * @returns 
	 */
	static async consultaTransportadora( codigoTransportadoraIntelipost: number, cep_filial_pedido:string ):Promise<resultTransp[]> {
		const sql = `
			SELECT 
				 tf.COD_TRANSP_INTERSIG
			FROM ${db_vendas}.transp_frete tf
			WHERE tf.COD_TRANSP_INTELIPOST = ? and tf.CEP_ORIGEM = ?
		`
		const [rows] = await conn2.query(sql, [ codigoTransportadoraIntelipost, cep_filial_pedido ])
		return rows  as resultTransp[]
	}


}
