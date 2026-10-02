import { conn2, db_publico } from "../../../database/database-connection.ts"

type cad_fpgt = {
    CODIGO: number
    FILIAL: number
    DESCRICAO: string
    DESCONTO: number
    ACRESCIMO: number
    DESC_MAXIMO: number
    NUM_PARCELAS: number
    DATA_CADASTRO: string
    INTERVALO: number
    DIAS_ENTRADA: number
    PRAZO_MEDIO: number
    ATIVO: 'S' | 'N'
    NO_SITE: 'S' | 'N'
    VALOR_MINIMO: number
    DATA_RECAD: string
    USA_PROMOCAO: string | 'S'
    JUROS_FINAN: number
    TIPO_RECEBIMENTO: number | 0
}

export class FpgtRepositoty {

    async findAll(): Promise<cad_fpgt[]> {

        const sql = `SELECT * FROM ${db_publico}.cad_fpgt where ATIVO = 'S' ; `
        const [rows] = await conn2.query(sql)
        return rows as cad_fpgt[]
    }
}