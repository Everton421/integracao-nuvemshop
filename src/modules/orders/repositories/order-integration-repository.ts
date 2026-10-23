
import mysql, { type ResultSetHeader } from 'mysql2/promise';

/**
 * Linha da tabela db_api.pedidos.
 *
 * Guarda o pedido recebido da Nuvemshop: id do pedido na Nuvemshop,
 * codigo do pedido e do cliente no ERP, nome do cliente, status
 * combinado (status/payment_status) e total.
 *
 * A chave unica e ( id_nuvemshop, codigo_pedido_erp ).
 */
export interface PedidoIntegracao {
    id?: number
    id_nuvemshop: string
    codigo_pedido_erp: number
    nome_cliente: string | null
    codigo_cliente_erp: number | null
    status_nuvenshop: string | null
    total: number | string | null
    created_at?: string
    updated_at?: string
}

/**
 * Acesso a tabela de pedidos da integracao (db_api.pedidos).
 *
 * O nome do banco vem com crase de database-connection.ts, por isso e usado direto:
 * ${this.databaseIntegration}.pedidos
 */
export class OrderIntegrationRepository{
        private connection: mysql.Pool;
        private databaseIntegration: string;

    constructor( connection:mysql.Pool, databaseIntegration: string  ){
        this.connection = connection;
        this.databaseIntegration =databaseIntegration;
    }

    /**
     * Grava o pedido. Se ( id_nuvemshop, codigo_pedido_erp ) ja existir,
     * atualiza nome_cliente, codigo_cliente_erp, status_nuvenshop e total.
     * created_at e preservado no update.
     * @param pedido dados do pedido (tabela pedidos)
     * @returns ResultSetHeader do INSERT
     */
   async insertOrUpdateOrder(pedido: PedidoIntegracao): Promise<ResultSetHeader> {

        const sql = `INSERT INTO ${this.databaseIntegration}.pedidos
                        ( id_nuvemshop, codigo_pedido_erp, nome_cliente, codigo_cliente_erp, status_nuvenshop, total )
                     VALUES ( ?, ?, ?, ?, ?, ? )
                     ON DUPLICATE KEY UPDATE
                        nome_cliente = VALUES(nome_cliente),
                        codigo_cliente_erp = VALUES(codigo_cliente_erp),
                        status_nuvenshop = VALUES(status_nuvenshop),
                        total = VALUES(total)`;

        const values = [
            pedido.id_nuvemshop,
            pedido.codigo_pedido_erp,
            pedido.nome_cliente,
            pedido.codigo_cliente_erp,
            pedido.status_nuvenshop,
            pedido.total
        ];

        const [rows] = await this.connection.query(sql, values);
        return rows as ResultSetHeader;
   }

}
