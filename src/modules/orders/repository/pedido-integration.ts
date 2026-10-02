import { type ResultSetHeader } from "mysql2";
import { conn2, database_api, db_vendas } from "../../../database/database-connection.ts";
import { type integracao_pedidos } from "../../../shared/interfaces/integracao-pedido.ts";

type inputInsertPedidoIntegration = Omit<integracao_pedidos, 'id' | 'created_at' | 'updated_at'>;


// deixa a tipagem parcial, porem o id é obrigatorio. 'created_at' e 'updated_at' sao omitidos 
type inputUpdatePedidoIntegration = Omit<Partial<inputInsertPedidoIntegration>, 'created_at' | 'updated_at'> & { id: number };

type inputSelect = Omit<integracao_pedidos, 'preco_total' | 'error_message' | 'dados_pedido' | 'created_at' | 'updated_at'>
type inputSelectPedidoIntegration = Partial<inputSelect>

    type resulVerifyOrderIntegration = { CODIGO: number | null , id:number ,data_atualizacao:string}

export class PedidoIntegration {
    private database = `\`${database_api}\``

    async insert(pedido: inputInsertPedidoIntegration): Promise<ResultSetHeader> {
        const sql =
            `
            INSERT INTO ${this.database}.pedidos SET
                shopify_order_id          = ?,
                shopify_order_number      = ?,
                erp_order_id              = ?,
                nome_cliente              = ?,
                email_cliente             = ?,
                preco_total               = ?,
                sync_status               = ?,
                status                    = ?,  
                status_pagamento          = ?,
                status_atendimento        = ?,
                error_message             = ?,
                dados_pedido              = ?,
                data_criacao              = ?,
                data_atualizacao          = ?,
                shopifyFulfillmentOrderId = ?,
                delivery_method_id        = ?,
                deliveryMethod           = ?,
                id_pedido_entrega         = ?,
                numero_nf                 = ?,
                chave_nf                  = ?,
                codigo_nf                 = ?,
                situacao_nf               = ?,
                nf_cancelada              = ?
            `
        const values = [
            pedido.shopify_order_id,
            pedido.shopify_order_number,
            pedido.erp_order_id,
            pedido.nome_cliente,
            pedido.email_cliente,
            pedido.preco_total,
            pedido.sync_status,
            pedido.status,
            pedido.status_pagamento,
            pedido.status_atendimento,
            pedido.error_message,
            pedido.dados_pedido,
            pedido.data_criacao,
            pedido.data_atualizacao,
            pedido.shopifyFulfillmentOrderId ?? null,
            pedido.delivery_method_id ?? null,
            pedido.deliveryMethod ?? null,
            pedido.id_pedido_entrega ?? null,
            pedido.numero_nf ?? null,
            pedido.chave_nf ?? null,
            pedido.codigo_nf ?? null,
            pedido.situacao_nf ?? null,
            pedido.nf_cancelada ?? null];


        const [result] = await conn2.query(sql, values)
        return result as ResultSetHeader;

    }

     async insertOnDuplicateUpdate(pedido: inputInsertPedidoIntegration): Promise<ResultSetHeader> {
        const sql =
            `
            INSERT INTO ${this.database}.pedidos SET
                shopify_order_id          = ?,
                shopify_order_number      = ?,
                erp_order_id              = ?,
                nome_cliente              = ?,
                email_cliente             = ?,
                preco_total               = ?,
                sync_status               = ?,
                status                    = ?,  
                status_pagamento          = ?,
                status_atendimento        = ?,
                error_message             = ?,
                dados_pedido              = ?,
                data_criacao              = ?,
                data_atualizacao          = ?,
                shopifyFulfillmentOrderId = ?,
                delivery_method_id        = ?,
                deliveryMethod           = ?,
                id_pedido_entrega         = ?,
                numero_nf                 = ?,
                chave_nf                  = ?,
                codigo_nf                 = ?,
                situacao_nf               = ?,
                nf_cancelada              = ?
                
                ON DUPLICATE KEY UPDATE 
                
                shopify_order_number      = ?,
                erp_order_id              = ?,
                nome_cliente              = ?,
                email_cliente             = ?,
                preco_total               = ?,
                sync_status               = ?,
                status                    = ?,  
                status_pagamento          = ?,
                status_atendimento        = ?,
                error_message             = ?,
                dados_pedido              = ?,
                data_criacao              = ?,
                data_atualizacao          = ?,
                shopifyFulfillmentOrderId = ?,
                delivery_method_id        = ?,
                deliveryMethod           = ?,
                id_pedido_entrega         = ?,
                numero_nf                 = ?,
                chave_nf                  = ?,
                codigo_nf                 = ?,
                situacao_nf               = ?,
                nf_cancelada              = ?
                

            `
        const values = [
            pedido.shopify_order_id,
            pedido.shopify_order_number,
            pedido.erp_order_id,
            pedido.nome_cliente,
            pedido.email_cliente,
            pedido.preco_total,
            pedido.sync_status,
            pedido.status,
            pedido.status_pagamento,
            pedido.status_atendimento,
            pedido.error_message,
            pedido.dados_pedido,
            pedido.data_criacao,
            pedido.data_atualizacao,
            pedido.shopifyFulfillmentOrderId ?? null,
            pedido.delivery_method_id ?? null,
            pedido.deliveryMethod ?? null,
            pedido.id_pedido_entrega ?? null,
            pedido.numero_nf ?? null,
            pedido.chave_nf ?? null,
            pedido.codigo_nf ?? null,
            pedido.situacao_nf ?? null,
            pedido.nf_cancelada ?? null,

             pedido.shopify_order_number,
            pedido.erp_order_id,
            pedido.nome_cliente,
            pedido.email_cliente,
            pedido.preco_total,
            pedido.sync_status,
            pedido.status,
            pedido.status_pagamento,
            pedido.status_atendimento,
            pedido.error_message,
            pedido.dados_pedido,
            pedido.data_criacao,
            pedido.data_atualizacao,
            pedido.shopifyFulfillmentOrderId ?? null,
            pedido.delivery_method_id ?? null,
            pedido.deliveryMethod ?? null,
            pedido.id_pedido_entrega ?? null,
            pedido.numero_nf ?? null,
            pedido.chave_nf ?? null,
            pedido.codigo_nf ?? null,
            pedido.situacao_nf ?? null,
            pedido.nf_cancelada ?? null
        
        
        ];


        const [result] = await conn2.query(sql, values)
        return result as ResultSetHeader;

    }

    async update(pedido: inputUpdatePedidoIntegration): Promise<ResultSetHeader> {
    
        const baseSql = `UPDATE ${this.database}.pedidos SET `

        const params = []
        const values = []

        if (pedido.id) {
            params.push(' id = ? ');
            values.push(`${pedido.id}`);
        }
        if (pedido.shopify_order_id) {
            params.push(' shopify_order_id = ? ');
            values.push(`${pedido.shopify_order_id}`);
        }
        if (pedido.shopify_order_number) {
            params.push(' shopify_order_number = ? ');
            values.push(`${pedido.shopify_order_number}`);
        }
        if (pedido.erp_order_id) {
            params.push(' erp_order_id = ? ');
            values.push(`${pedido.erp_order_id}`);
        }
        if (pedido.nome_cliente) {
            params.push(' nome_cliente = ? ');
            values.push(`${pedido.nome_cliente}`);
        }
        if (pedido.email_cliente) {
            params.push(' email_cliente = ? ');
            values.push(`${pedido.email_cliente}`);
        }
        if (pedido.preco_total) {
            params.push(' preco_total = ? ');
            values.push(`${pedido.preco_total}`);
        }
        if (pedido.sync_status) {
            params.push(' sync_status = ? ');
            values.push(`${pedido.sync_status}`);
        }
        if (pedido.status_pagamento) {
            params.push(' status_pagamento = ? ');
            values.push(`${pedido.status_pagamento}`);
        }
        if (pedido.status_atendimento) {
            params.push(' status_atendimento = ? ');
            values.push(`${pedido.status_atendimento}`);
        }
        if (pedido.error_message) {
            params.push(' error_message = ? ');
            values.push(`${pedido.error_message}`);
        }
        if (pedido.dados_pedido) {
            params.push(' dados_pedido = ? ');
            values.push(`${pedido.dados_pedido}`);
        }
        if (pedido.data_atualizacao) {
            params.push(' data_atualizacao = ? ');
            values.push(`${pedido.data_atualizacao}`);
        }
        if (pedido.shopifyFulfillmentOrderId !== undefined) {
            params.push(' shopifyFulfillmentOrderId = ? ');
            values.push(pedido.shopifyFulfillmentOrderId);
        }
        if (pedido.delivery_method_id !== undefined) {
            params.push(' delivery_method_id = ? ');
            values.push(pedido.delivery_method_id);
        }
        if (pedido.deliveryMethod !== undefined) {
            params.push(' deliveryMethod = ? ');
            values.push(pedido.deliveryMethod);
        }
        if (pedido.id_pedido_entrega !== undefined) {
            params.push(' id_pedido_entrega = ? ');
            values.push(pedido.id_pedido_entrega);
        }
        if (pedido.numero_nf !== undefined) {
            params.push(' numero_nf = ? ');
            values.push(pedido.numero_nf);
        }
        if (pedido.chave_nf !== undefined) {
            params.push(' chave_nf = ? ');
            values.push(pedido.chave_nf);
        }
        if (pedido.codigo_nf !== undefined) {
            params.push(' codigo_nf = ? ');
            values.push(pedido.codigo_nf);
        }
        if (pedido.situacao_nf !== undefined) {
            params.push(' situacao_nf = ? ');
            values.push(pedido.situacao_nf);
        }
        if (pedido.nf_cancelada !== undefined) {
            params.push(' nf_cancelada = ? ');
            values.push(pedido.nf_cancelada);
        }

        if(pedido.status){
           params.push(' status = ? ');
            values.push(pedido.status);
        }
        const whereClause = ' WHERE id = ? ';
        values.push(pedido.id);

        const finalSql = baseSql + params.join(' , ') + whereClause;

        const [rows] = await conn2.query(finalSql, values)
        return rows as ResultSetHeader;

    }

    async selectOrderErpAndIntegration(shopify_order_id:string): Promise< resulVerifyOrderIntegration[]>{
            
        const sql = 
         `SELECT 
         p.id,
         co.CODIGO,
         p.data_atualizacao
        FROM    ${this.database}.pedidos p 
                LEFT JOIN ${db_vendas}.cad_orca co on co.SHOPIFY_ORDER_ID = p.shopify_order_id
            WHERE co.SHOPIFY_ORDER_ID = ?
        `
        const [rows] = await conn2.query(sql,  shopify_order_id  )
        return rows as resulVerifyOrderIntegration[]  ;
    }

    async selectByParam(pedido: inputSelectPedidoIntegration): Promise<integracao_pedidos[]> {

        const params: string[] = []
        const values: any[] = [];
        if (pedido.data_atualizacao) {
            params.push(' data_atualizacao = ? ');
            values.push(pedido.data_atualizacao);
        }
        if (pedido.data_criacao) {
            params.push(' data_criacao = ? ');
            values.push(pedido.data_criacao);
        }
        if (pedido.email_cliente) {
            params.push(' email_cliente = ? ');
            values.push(pedido.email_cliente);
        }
        if (pedido.erp_order_id) {
            params.push(' erp_order_id = ? ');
            values.push(pedido.erp_order_id);
        }
        if (pedido.id) {
            params.push(' id = ? ');
            values.push(pedido.id);
        }
        if (pedido.nome_cliente) {
            params.push(' nome_cliente = ? ');
            values.push(pedido.nome_cliente);
        }
        if (pedido.shopify_order_id) {
            params.push(' shopify_order_id = ? ');
            values.push(pedido.shopify_order_id);
        }
        if (pedido.shopify_order_number) {
            params.push(' shopify_order_number = ? ');
            values.push(pedido.shopify_order_number);
        }
        if (pedido.status_atendimento) {
            params.push(' status_atendimento = ? ');
            values.push(pedido.status_atendimento);
        }
        if (pedido.status_pagamento) {
            params.push(' status_pagamento = ? ');
            values.push(pedido.status_pagamento);
        }
        if (pedido.sync_status) {
            params.push(' sync_status = ? ');
            values.push(pedido.sync_status);
        }
        if (pedido.shopifyFulfillmentOrderId) {
            params.push(' shopifyFulfillmentOrderId = ? ');
            values.push(pedido.shopifyFulfillmentOrderId);
        }
        if (pedido.delivery_method_id) {
            params.push(' delivery_method_id = ? ');
            values.push(pedido.delivery_method_id);
        }
        if (pedido.deliveryMethod) {
            params.push(' deliveryMethod = ? ');
            values.push(pedido.deliveryMethod);
        }
        if (pedido.id_pedido_entrega) {
            params.push(' id_pedido_entrega = ? ');
            values.push(pedido.id_pedido_entrega);
        }
        if (pedido.numero_nf) {
            params.push(' numero_nf = ? ');
            values.push(pedido.numero_nf);
        }
        if (pedido.chave_nf) {
            params.push(' chave_nf = ? ');
            values.push(pedido.chave_nf);
        }
        if (pedido.codigo_nf) {
            params.push(' codigo_nf = ? ');
            values.push(pedido.codigo_nf);
        }
        if (pedido.situacao_nf) {
            params.push(' situacao_nf = ? ');
            values.push(pedido.situacao_nf);
        }
        if (pedido.nf_cancelada) {
            params.push(' nf_cancelada = ? ');
            values.push(pedido.nf_cancelada);
        }
         if(pedido.status){
           params.push(' status = ? ');
            values.push(pedido.status);
        }

        const baseSql = ` SELECT * FROM ${this.database}.pedidos `
        const whereClause = ' WHERE '
        const finalSql = baseSql + whereClause + params.join(' AND ')

        const [rows] = await conn2.query(finalSql, values);

        return rows as integracao_pedidos[]

    }



    async findAll(filters: { search?: string, sync_status?: string }, page: number = 1, limit: number = 20): Promise<{ data: integracao_pedidos[], total: number }> {
        const offset = (page - 1) * limit;
        const params: any[] = [];

        // Truque "WHERE 1=1" para facilitar a concatenação de ANDs
        let whereClause = " WHERE 1=1 ";

        // Filtro por Status de Sincronização
        if (filters.sync_status && filters.sync_status !== '') {
            whereClause += " AND sync_status = ? ";
            params.push(filters.sync_status);
        }

        // Filtro de Busca (Nome, Email, Número do Pedido Shopify ou ID ERP)
        if (filters.search && filters.search !== '') {
            whereClause += ` AND (
                    nome_cliente LIKE ? OR 
                    email_cliente LIKE ? OR 
                    shopify_order_number LIKE ? OR 
                    erp_order_id LIKE ?
                ) `;
            const term = `%${filters.search}%`;
            params.push(term, term, term, term);
        }

        // Query de Contagem (Total)
        const sqlCount = `SELECT COUNT(*) as total FROM ${this.database}.pedidos ${whereClause}`;

        const [resultTotal] = await conn2.query(sqlCount, params) as any;

        const total = resultTotal[0].total;


        // Query de Dados (Paginada)
        const sqlData = `
                    SELECT * FROM ${this.database}.pedidos 
                    ${whereClause} 
                    ORDER BY data_criacao DESC 
                    LIMIT ? OFFSET ?
                `;
        const paramsData = [...params, limit, offset];

        const [resultData] = await conn2.query(sqlData, paramsData) as any[];

        return {
            data: resultData as integracao_pedidos[],
            total: total
        }
    }


}

