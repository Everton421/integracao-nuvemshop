import { pgClient } from "../../../database/pg-connection.ts";

type pgImagensProdutos = { refs_img: string, imagem: string, imagem_original: string, id: string }

export class PgImagensProdutos {

    async find(refs_img: string): Promise<pgImagensProdutos[] | undefined> {
        const client = await pgClient.connect()

        try {
            // ALTERAÇÃO AQUI: mudamos de 'hex' para 'base64'
            const query = `
                SELECT 
                     encode(imagem, 'base64') AS imagem,
                      imagem as imagem_original,
                       refs_img,
                       id
                FROM imagens_produto.imagem_produto 
                WHERE refs_img = $1
                ORDER BY id ASC
            `;

            // Usando prepared statement ($1) para segurança contra SQL Injection
            const result = await client.query(query, [refs_img]);

            return result.rows as pgImagensProdutos[]

        } catch (err: any) {
            console.error('Erro na query:', err.message);
        } finally {
            client.release()
        }
    }


    async findTest(refs_img: string): Promise<pgImagensProdutos[] | undefined> {
        const client = await pgClient.connect()

        try {
            // ALTERAÇÃO AQUI: mudamos de 'hex' para 'base64'
            const query = `
                SELECT 
                    *
                FROM imagens_produto.imagem_produto 
                WHERE refs_img = $1
            `;

            // Usando prepared statement ($1) para segurança contra SQL Injection
            const result = await client.query(query, [refs_img]);

            return result.rows as pgImagensProdutos[]

        } catch (err: any) {
            console.error('Erro na query:', err.message);
        } finally {
            client.release()
        }
    }

    /**
     *  Obtem uma lista com os ids das fotos e os produtos
     * OBS.: METODO NÃO RETORNA FOTO
     * @returns 
     */
    async findAllOmitImages(erp_sku?: number): Promise<Omit<pgImagensProdutos, 'imagem_original' | 'imagem'>[] | undefined> {
        const client = await pgClient.connect()

        try {
            // ALTERAÇÃO AQUI: mudamos de 'hex' para 'base64'
            let basesql = `
                SELECT 
                       refs_img,
                       id
                FROM imagens_produto.imagem_produto 
               
            `;

            const values: string[] = [];
            if (erp_sku && erp_sku != undefined) {
                basesql = basesql + ` WHERE refs_img = $1 `
            }

            // Usando prepared statement ($1) para segurança contra SQL Injection
            const result = await client.query(basesql, values);

            return result.rows as Omit<pgImagensProdutos, 'imagem_original' | 'imagem'>[];

        } catch (err: any) {
            console.error('Erro na query:', err.message);
        } finally {
            client.release()
        }
    }
    /**
    *  Obtem uma lista com os ids das fotos e os produtos agrupados pelo codigo do produto
    * OBS.: METODO NÃO RETORNA FOTO
    * @returns 
    */
    async findAllOmitImagesGroupBy(erp_sku?: number): Promise<Omit<pgImagensProdutos, 'imagem_original' | 'imagem'>[] | undefined> {
        const client = await pgClient.connect()

        try {
            // ALTERAÇÃO AQUI: mudamos de 'hex' para 'base64'
            let basesql = `
                SELECT 
                       refs_img,
                       MAX(id) as id
                FROM imagens_produto.imagem_produto 
            `;

            const values: string[] = [];
            if (erp_sku && erp_sku != undefined) {
                basesql = basesql + ` WHERE refs_img = $1 `
                values.push(String(erp_sku));
            }
            basesql = basesql + ` GROUP BY refs_img;`

            const result = await client.query(basesql, values);

            return result.rows as Omit<pgImagensProdutos, 'imagem_original' | 'imagem'>[];

        } catch (err: any) {
            console.error('Erro na query:', err.message);
        } finally {
            client.release()
        }
    }
}