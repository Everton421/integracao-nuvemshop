import { type ResultSetHeader } from "mysql2";
import { conn2, database_api } from "../../../database/database-connection.ts";
import { type FotosEnvioShopify } from "../../../shared/interfaces/fotos-envio-shopify.ts";

export class FotosEnvioShopifyRepository {
    private database = `\`${database_api}\``;

    async insert(foto: {
        erp_sku: string;
        hash_sha256: string;
        media_id: string;
        original_source: string;
    }): Promise<{ sucess: boolean; message: string }> {
        const sql = `INSERT INTO ${this.database}.fotos_envio_shopify SET
            erp_sku = ?,
            hash_sha256 = ?,
            media_id = ?,
            original_source = ?`;

        const [rows] = await conn2.query(sql, [
            foto.erp_sku,
            foto.hash_sha256,
            foto.media_id,
            foto.original_source
        ]);
        const result = rows as ResultSetHeader;
        return { sucess: result.affectedRows > 0, message: '' };
    }

    async findByErpSku(erp_sku: number): Promise<FotosEnvioShopify[]> {
        const sql = `SELECT * FROM ${this.database}.fotos_envio_shopify WHERE erp_sku = ?`;
        const [rows] = await conn2.query(sql, [erp_sku]);
        return rows as FotosEnvioShopify[];
    }

    async deleteByErpSku(erp_sku: number): Promise<{ sucess: boolean; message: string }> {
        const sql = `DELETE FROM ${this.database}.fotos_envio_shopify WHERE erp_sku = ?`;
        const [rows] = await conn2.query(sql, [erp_sku]);
        const result = rows as ResultSetHeader;
        return { sucess: result.affectedRows > 0, message: '' };
    }
}
