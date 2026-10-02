import { type ResultSetHeader } from "mysql2";
import { conn2, db_publico } from "../../database/database-connection.ts";
import { type cad_clie } from "../../shared/interfaces/cad_clie.ts";

type partialClient = Omit<Partial<cad_clie>, 'CODIGO'>

type client = partialClient & { CODIGO: number }

type completeClient = client & { CODIGO: number }

export class ClienteRepository {

   static async cadastrarClientErp(cliente: cad_clie): Promise<ResultSetHeader> {

        const sql = `
            INSERT INTO ${db_publico}.cad_clie (
                NOME,
                APELIDO,
                FIS_JUR,
                CPF,
                RG,
                EMAIL_FISCAl,
                EMAIL,
                SENHA,
                OBSERVACOES,
                HISTORICO,
                BLOQ_MOTIVO,
                OBS_BANCARIA,
                OBS_COMERCIAL1,
                OBS_COMERCIAL2,
                OBS_COMERCIAL3,
                OBS_PESSOAL,
                ENDERECO,
                NUMERO,
                COMPLEMENTO,
                BAIRRO,
                CIDADE,
                ESTADO,
                CEP,
                TELEFONE_RES,
                CELULAR,
                DATA_CADASTRO,
                DATA_RECAD,
                CONSUMIDOR_FINAL,
                ATIVO,
                NO_SITE,
                VENDEDOR,
                MIDIA_CLI
            ) VALUES (
                   ?,
                   ?,
                   ?,
                   ?,
                   ?,
                   ?,
                   ?,
                   ?,
                   ?,
                   ?,
                   ?,
                   ?,
                   ?,
                   ?,
                   ?,
                   ?,
                   ?,
                   ?,
                   ?,
                   ?,
                   ?,
                   ?,
                   ?,
                   ?,
                   ?,
                   ?,
                   ?,
                   ?,
                   ?,
                   ?,
                   ?,
                   ?
            );
              `;

        const values = [
            cliente.NOME,
            cliente.APELIDO,
            cliente.FIS_JUR,
            cliente.CPF,
            cliente.RG,
            cliente.EMAIL_FISCAl,
            cliente.EMAIL,
            cliente.SENHA,
            cliente.OBSERVACOES,
            cliente.HISTORICO,
            cliente.BLOQ_MOTIVO,
            cliente.OBS_BANCARIA,
            cliente.OBS_COMERCIAL1,
            cliente.OBS_COMERCIAL2,
            cliente.OBS_COMERCIAL3,
            cliente.OBS_PESSOAL,
            cliente.ENDERECO,
            cliente.NUMERO,
            cliente.COMPLEMENTO,
            cliente.BAIRRO,
            cliente.CIDADE,
            cliente.ESTADO,
            cliente.CEP,
            cliente.TELEFONE_RES,
            cliente.CELULAR,
            cliente.DATA_CADASTRO,
            cliente.DATA_RECAD,
            cliente.CONSUMIDOR_FINAL,
            cliente.ATIVO,
            cliente.NO_SITE,
            cliente.VENDEDOR,
            10
        ]
        const [row] = await conn2.query(sql, values);
        return row as any;
    }

    static async cadastrarVendedorCliente(cliente: number, vendedor: number, sequencia: number, prior: number): Promise<ResultSetHeader> {
        const sql = `
                INSERT INTO ${db_publico}.vend_clie set
                    CLIENTE =  ?,
                    VENDEDOR = ?,
                    SEQ = ? ,
                    PRIOR = ?
                    ;
                `
        const values = [cliente, vendedor, sequencia, prior]
        const [result] = await conn2.query(sql, values)
        return result as ResultSetHeader;
    }



    static async  buscaPorcnpj(cnpj: string): Promise<completeClient[]> {

        const sql = `SELECT * FROM ${db_publico}.cad_clie WHERE CPF = ? `
        const [rows] = await conn2.query(sql, cnpj)
        return rows as completeClient[];
    }

   static async updateClientErp(cliente: client): Promise<ResultSetHeader> {

        const baseSql = ` UPDATE ${db_publico}.cad_clie SET `

        const conditions = []
        const values = []
        if (cliente.APELIDO !== undefined) {
            conditions.push(' APELIDO = ? ');
            values.push(`${cliente.APELIDO}`);
        }
        if (cliente.FIS_JUR !== undefined) {
            conditions.push(' FIS_JUR = ? ');
            values.push(`${cliente.FIS_JUR}`);
        }
        if (cliente.CPF !== undefined) {
            conditions.push(' CPF = ? ');
            values.push(`${cliente.CPF}`);
        }
        if (cliente.RG !== undefined) {
            conditions.push(' RG = ? ');
            values.push(`${cliente.RG}`);
        }
        if (cliente.EMAIL_FISCAl !== undefined) {
            conditions.push(' EMAIL_FISCAl = ? ');
            values.push(`${cliente.EMAIL_FISCAl}`);
        }
        if (cliente.EMAIL !== undefined) {
            conditions.push(' EMAIL = ? ');
            values.push(`${cliente.EMAIL}`);
        }
        if (cliente.SENHA !== undefined) {
            conditions.push(' SENHA = ? ');
            values.push(`${cliente.SENHA}`);
        }
        if (cliente.OBSERVACOES !== undefined) {
            conditions.push(' OBSERVACOES = ? ');
            values.push(`${cliente.OBSERVACOES}`);
        }
        if (cliente.HISTORICO !== undefined) {
            conditions.push(' HISTORICO = ? ');
            values.push(`${cliente.HISTORICO}`);
        }
        if (cliente.BLOQ_MOTIVO !== undefined) {
            conditions.push(' BLOQ_MOTIVO = ? ');
            values.push(`${cliente.BLOQ_MOTIVO}`);
        }
        if (cliente.OBS_BANCARIA !== undefined) {
            conditions.push(' OBS_BANCARIA = ? ');
            values.push(`${cliente.OBS_BANCARIA}`);
        }
        if (cliente.OBS_COMERCIAL1 !== undefined) {
            conditions.push(' OBS_COMERCIAL1 = ? ');
            values.push(`${cliente.OBS_COMERCIAL1}`);
        }
        if (cliente.OBS_COMERCIAL2 !== undefined) {
            conditions.push(' OBS_COMERCIAL2 = ? ');
            values.push(`${cliente.OBS_COMERCIAL2}`);
        }
        if (cliente.OBS_COMERCIAL3 !== undefined) {
            conditions.push(' OBS_COMERCIAL3 = ? ');
            values.push(`${cliente.OBS_COMERCIAL3}`);
        }
        if (cliente.OBS_PESSOAL !== undefined) {
            conditions.push(' OBS_PESSOAL = ? ');
            values.push(`${cliente.OBS_PESSOAL}`);
        }
        if (cliente.ENDERECO !== undefined) {
            conditions.push(' ENDERECO = ? ');
            values.push(`${cliente.ENDERECO}`);
        }
        if (cliente.NUMERO !== undefined) {
            conditions.push(' NUMERO = ? ');
            values.push(`${cliente.NUMERO}`);
        }
        if (cliente.COMPLEMENTO !== undefined) {
            conditions.push(' COMPLEMENTO = ? ');
            values.push(`${cliente.COMPLEMENTO}`);
        }
        if (cliente.BAIRRO !== undefined) {
            conditions.push(' BAIRRO = ? ');
            values.push(`${cliente.BAIRRO}`);
        }
        if (cliente.CIDADE !== undefined) {
            conditions.push(' CIDADE = ? ');
            values.push(`${cliente.CIDADE}`);
        }
        if (cliente.ESTADO !== undefined) {
            conditions.push(' ESTADO = ? ');
            values.push(`${cliente.ESTADO}`);
        }
        if (cliente.CEP !== undefined) {
            conditions.push(' CEP = ? ');
            values.push(`${cliente.CEP}`);
        }
        if (cliente.TELEFONE_RES !== undefined) {
            conditions.push(' TELEFONE_RES = ? ');
            values.push(`${cliente.TELEFONE_RES}`);
        }
        if (cliente.CELULAR !== undefined) {
            conditions.push(' CELULAR = ? ');
            values.push(`${cliente.CELULAR}`);
        }
        if (cliente.CONSUMIDOR_FINAL !== undefined) {
            conditions.push(' CONSUMIDOR_FINAL = ? ');
            values.push(`${cliente.CONSUMIDOR_FINAL}`);
        }
        if (cliente.ATIVO !== undefined) {
            conditions.push(' ATIVO = ? ');
            values.push(`${cliente.ATIVO}`);
        }
        if (cliente.NO_SITE !== undefined) {
            conditions.push(' NO_SITE = ? ');
            values.push(`${cliente.NO_SITE}`);
        }
        if (cliente.VENDEDOR !== undefined) {
            conditions.push(' VENDEDOR = ? ');
            values.push(`${cliente.VENDEDOR}`);
        }

        if (cliente.DATA_RECAD !== undefined) {
            conditions.push(' DATA_RECAD = ? ');
            values.push(`${cliente.DATA_RECAD}`)
        }

           if(cliente.MIDIA_CLI) {
            conditions.push(" MIDIA_CLI = ? ");
             values.push(10);
           }

        const whreClause = `WHERE CODIGO = ?  `
        values.push(cliente.CODIGO);
        const finalSql = baseSql + conditions.join(' , ') + whreClause


        const [rows] = await conn2.query(finalSql, values)
        return rows as ResultSetHeader;
    }

}   