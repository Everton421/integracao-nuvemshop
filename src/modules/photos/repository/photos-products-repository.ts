import { type ResultSetHeader } from "mysql2";
import { conn2, database_api } from "../../../database/database-connection.ts";
import { type fotos_produto } from "../../../shared/interfaces/fotos_produtos.ts";

type inputInsertFoto = Omit<fotos_produto, 'created_at' | 'updated_at'>

type auxUpdate = Partial<Omit<inputInsertFoto, 'id' | 'erp_sku'>>

type inputUpdate = auxUpdate & { id: number, erp_sku: number }

type inputQueryPhotoOldSite = { id?: number, sku?: number, gallery?: string, link?: string }

type resultQueryPhotoOldSite = {
    id: number
    sku: number
    gallery: string | null
    link: string | null
}
export class FotosProdutoIntegration {
    private database = `\`${database_api}\``

    async insert(foto: Partial<inputUpdate>): Promise<{ sucess: boolean, message: string }> {

        const baseSql = ` INSERT INTO ${this.database}.fotos_produtos 
                                 SET
                      `
        const params = []
        const values = []


        params.push(' erp_sku = ? ')
        values.push(`${foto.erp_sku}`)

        if (foto.referencia) {
            params.push(' referencia = ? ')
            values.push(`${foto.referencia}`)
        }
        if (foto.cod_barras) {
            params.push(' cod_barras = ? ')
            values.push(`${foto.cod_barras}`)
        }

        if (foto.shopify_product_id) {
            params.push(' shopify_product_id = ? ')
            values.push(`${foto.shopify_product_id}`)
        }
        if (foto.link) {
            params.push(' link = ? ')
            values.push(`${foto.link}`)
        }

        if (foto.ativo) {
            params.push(' ativo = ? ')
            values.push(`${foto.ativo}`)
        }
        if (foto.id_postgres) {
            params.push(' id_postgres = ? ')
            values.push(`${foto.id_postgres}`)
        }
        if (foto.hash_sha256) {
            params.push(' hash_sha256 = ? ')
            values.push(foto.hash_sha256)
        }
        if (foto.id_site_antigo) {
            params.push(' id_site_antigo = ? ')
            values.push(`${foto.id_site_antigo}`)
        }
        const finalSql = baseSql + params.join(' , ');

        const [rows] = await conn2.query(finalSql, values);
        const result = rows as ResultSetHeader;

        if (result.affectedRows > 0) {
            return { sucess: true, message: '' }
        } else {
            return { sucess: false, message: '' }
        }


    }

    async selectPhotosOldSite(foto: inputQueryPhotoOldSite): Promise<resultQueryPhotoOldSite[]> {

        const baseSql = `  SELECT *  FROM ${this.database}.fotos_site_antigo 
                      `
        const params = []
        const values = []

        if (foto.sku) {
            params.push(' sku = ? ')
            values.push(Number(foto.sku))
        }

        if (foto.id) {
            params.push(' id = ? ')
            values.push(Number(foto.id))
        }
        if (foto.gallery) {
            params.push(' gallery = ? ')
            values.push(foto.gallery);
        }
        if (foto.link) {
            params.push(' link = ? ')
            values.push(foto.link);
        }


        const whereClause = ` WHERE `

        const finalSql = baseSql + whereClause + params.join(' AND ');

        const [rows] = await conn2.query(finalSql, values)
        return rows as resultQueryPhotoOldSite[];
    }
    async updatePhotosOldSite(link: string, id: number): Promise<{ sucess: boolean, message: string }> {

        const sql = `  UPDATE   ${this.database}.fotos_site_antigo set link = ? where id = ? ;`;


        const [rows] = await conn2.query(sql, [link, id]);
        const result = rows as ResultSetHeader;

        if (result.affectedRows > 0) {
            return { sucess: true, message: '' }
        } else {
            return { sucess: false, message: '' }
        }
    }

    async insertOrUpdate(foto: Partial<inputUpdate>): Promise<{ sucess: boolean, message: string }> {
        return new Promise(async (resolve, reject) => {

            const baseSql = ` INSERT INTO ${this.database}.fotos_produtos 
                                 SET
                      `
            const params = []
            const values = []


            params.push(' erp_sku = ? ')
            values.push(`${foto.erp_sku}`)

            if (foto.referencia) {
                params.push(' referencia = ? ')
                values.push(`${foto.referencia}`)
            }
            if (foto.cod_barras) {
                params.push(' cod_barras = ? ')
                values.push(`${foto.cod_barras}`)
            }

            if (foto.shopify_product_id) {
                params.push(' shopify_product_id = ? ')
                values.push(`${foto.shopify_product_id}`)
            }
            if (foto.link) {
                params.push(' link = ? ')
                values.push(`${foto.link}`)
            }

            if (foto.ativo) {
                params.push(' ativo = ? ')
                values.push(`${foto.ativo}`)
            }
            if (foto.id_postgres) {
                params.push(' id_postgres = ? ')
                values.push(`${foto.id_postgres}`)
            }
            if (foto.hash_sha256) {
                params.push(' hash_sha256 = ? ')
                values.push(foto.hash_sha256)
            }

            const finalSql = baseSql + params.join(' , ') + ` ON DUPLICATE KEY UPDATE  link = '${foto.link}', id_postgres = '${foto.id_postgres}', hash_sha256 = '${foto.hash_sha256}' `;


            const [resultInsert] = await conn2.query(finalSql, values)
            const result = resultInsert as ResultSetHeader

            if (result.affectedRows > 0) {
                return { sucess: true, message: '' }
            } else {
                return { sucess: false, message: '' }
            }
        })
    }

    async selectByHash(hash: string): Promise<fotos_produto[]> {
        const sql = `SELECT * FROM ${this.database}.fotos_produtos WHERE hash_sha256 = ?`;
        const [rows] = await conn2.query(sql, [hash]);
        return rows as fotos_produto[];
    }

    async update(foto: inputUpdate): Promise<{ sucess: boolean, message: string }> {

        const baseSql = `  UPDATE   ${this.database}.fotos_produtos 
                                 SET `
        const params = []
        const values = []

        params.push(' erp_sku = ? ')
        values.push(`${foto.erp_sku}`)

        if (foto.referencia) {
            params.push(' referencia = ? ')
            values.push(`${foto.referencia}`)
        }
        if (foto.cod_barras) {
            params.push(' cod_barras = ? ')
            values.push(`${foto.cod_barras}`)
        }

        if (foto.shopify_product_id) {
            params.push(' shopify_product_id = ? ')
            values.push(`${foto.shopify_product_id}`)
        }
        if (foto.link) {
            params.push(' link = ? ')
            values.push(`${foto.link}`)
        }

        if (foto.ativo) {
            params.push(' ativo = ? ')
            values.push(`${foto.ativo}`)
        }
        if (foto.hash_sha256) {
            params.push(' hash_sha256 = ? ')
            values.push(foto.hash_sha256)
        }

        if (foto.id_site_antigo) {
            params.push(' id_site_antigo = ? ')
            values.push(`${foto.id_site_antigo}`)
        }

        const whereClause = ` WHERE id = ? `
        values.push(foto.id)

        const finalSql = baseSql + params.join(' , ') + whereClause;

        const [rows] = await conn2.query(finalSql, values);
        const result = rows as ResultSetHeader;

        if (result.affectedRows > 0) {
            return { sucess: true, message: '' }
        } else {
            return { sucess: false, message: '' }
        }
    }

    async selectByParam(foto: Partial<fotos_produto>): Promise<fotos_produto[]> {

        const baseSql = `  SELECT *  FROM ${this.database}.fotos_produtos 
                      `
        const params = []
        const values = []

        if (foto.erp_sku) {
            params.push(' erp_sku = ? ')
            values.push(`${foto.erp_sku}`)
        }

        if (foto.id) {
            params.push(' id = ? ')
            values.push(`${foto.id}`)
        }

        if (foto.referencia) {
            params.push(' referencia = ? ')
            values.push(`${foto.referencia}`)
        }
        if (foto.cod_barras) {
            params.push(' cod_barras = ? ')
            values.push(`${foto.cod_barras}`)
        }

        if (foto.shopify_product_id) {
            params.push(' shopify_product_id = ? ')
            values.push(`${foto.shopify_product_id}`)
        }
        if (foto.link) {
            params.push(' link = ? ')
            values.push(`${foto.link}`)
        }

        if (foto.ativo) {
            params.push(' ativo = ? ')
            values.push(`${foto.ativo}`)
        }
        if (foto.id_postgres) {
            params.push(' id_postgres = ? ')
            values.push(`${foto.id_postgres}`)

        }

        if (foto.id_site_antigo) {
            params.push(' id_site_antigo = ? ')
            values.push(`${foto.id_site_antigo}`)
        }

        if (foto.hash_sha256) {
            params.push(' hash_sha256 = ? ')
            values.push(foto.hash_sha256)
        }
        const whereClause = ` WHERE `

        const finalSql = baseSql + whereClause + params.join(' AND ');

        const [rows] = await conn2.query(finalSql, values)
        return rows as fotos_produto[];
    }

    async selectByLinkIsNull(): Promise<fotos_produto[]> {

        const baseSql = `  SELECT *  FROM ${this.database}.fotos_produtos WHERE link is null
                      `
        const [rows] = await conn2.query(baseSql)
        return rows as fotos_produto[];
    }

    async deleteById(id: number): Promise<ResultSetHeader> {

        const baseSql = `  DELETE FROM  ${this.database}.fotos_produtos WHERE id = ? `;
        const [result] = await conn2.query(baseSql, id)
        return result as ResultSetHeader

    }

    async deleteByErpSku(erp_sku: number) {


        const baseSql = `  DELETE FROM  ${this.database}.fotos_produtos WHERE erp_sku = ?`;

        const [resultDel] = await conn2.query(baseSql, erp_sku);

        const result = resultDel as ResultSetHeader;
        if (result.affectedRows > 0) {
            return { sucess: true, message: '' }
        } else {

            return { sucess: false, message: '' }
        }

    }
}