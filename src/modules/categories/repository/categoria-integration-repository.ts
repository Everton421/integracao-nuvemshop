import { type ResultSetHeader } from "mysql2/promise"
import { type CategoriaIntegracao, type NivelCategoria } from "../../../shared/interfaces/categoria-integracao.ts"
import mysql from 'mysql2/promise'
 

   type inputPartialUpdate = {
        codigo_erp:number,
        id_nuvemshop:string,
        nivel:'grupo' | 'subrupo',
        codigo_erp_pai: string
        nome: string
        parent_id_nuvemshop: string | null
        dados_categoria:string
        ultimo_envio:string
    }
 type inputInsert = {
    id_nuvemshop:string,
    codigo_erp:number,
    nivel:'grupo' | 'subgrupo',
    codigo_erp_pai:number | null,
    nome:string ,
    parent_id_nuvemshop:string,
    ultimo_envio:string
 }
export class CategoriaIntegrationRepository {

    private database:string ; 
    private connection: mysql.Pool;

    constructor( connection:mysql.Pool, database:string){
        this.connection = connection
        this.database= database
    }
     

    

    /**
     * Busca uma categoria pelo par nivel + codigo do ERP.
     *
     * @returns CategoriaIntegracao[]
     */
    async findByErpCodigo(nivel: NivelCategoria, codigo: number): Promise<CategoriaIntegracao[]> {

        const sql = `SELECT * FROM ${this.database}.categorias
                      WHERE nivel = ? AND erp_codigo = ?
                      LIMIT 1`

        const [rows] = await this.connection.query(sql, [nivel, codigo])
        return rows as CategoriaIntegracao[]
    }
 
 
    async insert(inputInsert:inputInsert){
        const {  id_nuvemshop  , codigo_erp ,  nivel  , codigo_erp_pai   , nome  , parent_id_nuvemshop  , ultimo_envio }= inputInsert;
        const sql = `INSERT INTO ${this.database}.categorias SET 
                   id_nuvemshop = ? , codigo_erp = ?,  nivel = ?, codigo_erp_pai = ? , nome = ?, parent_id_nuvemshop = ?,
                    ultimo_envio = ?
                    `
                    const values = [  id_nuvemshop  , codigo_erp ,  nivel  , codigo_erp_pai   , nome  , parent_id_nuvemshop  , ultimo_envio  ]
          const [resultInsert] = await this.connection.query(sql, values );
            return resultInsert as ResultSetHeader;
        }

    async partialUpdate(input:  Partial<inputPartialUpdate>, whereClauseField: 'codigo_erp' | 'id' | 'id_nuvemshop', valueWhereClause:  any){
        const {  id_nuvemshop, codigo_erp, nivel, codigo_erp_pai, nome, parent_id_nuvemshop, dados_categoria, ultimo_envio} = input;

    const values=[];    
    const fields =[];
    const baseSql = ` UPDATE ${this.database}.categorias set `

        if(id_nuvemshop){
            fields.push(' id_nuvemshop = ? ');
            values.push(id_nuvemshop);
        }
        if(codigo_erp){
            fields.push(' codigo_erp = ? ');
            values.push(codigo_erp);
        }
        if(nivel){
            fields.push(' nivel = ? ');
            values.push(nivel);
        }
        if(codigo_erp_pai){
            fields.push(' codigo_erp_pai = ? ');
            values.push(codigo_erp_pai);
        }
        if(nome){
            fields.push(' nome = ? ');
            values.push(nome);
        }
        if(parent_id_nuvemshop){
            fields.push(' parent_id_nuvemshop = ? ');
            values.push(parent_id_nuvemshop);
        }
        if(dados_categoria){
            fields.push(' dados_categoria = ? ');
            values.push(dados_categoria);
        }
        if(ultimo_envio){
            fields.push(' ultimo_envio = ? ');
            values.push(ultimo_envio);
        }

        const whereClause = ` WHERE ${whereClauseField} = ? `;
            values.push(valueWhereClause);

        const finalSql = baseSql + fields.join(' , ') + whereClause;
        const [resultUpdate] = await this.connection.query(finalSql, values );
        return resultUpdate as ResultSetHeader;
    }

    async checkShippmentstatus (erp_category_sku:number):Promise<CategoriaIntegracao[]>{
      return []
    }
}