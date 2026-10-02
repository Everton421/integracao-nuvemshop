import axios, { type AxiosInstance } from "axios"

export class NuvemshopApi {
    public api: AxiosInstance;

    /**
     * 
     * @param baseURL Url base da api Nuvemshop
     * @param apiVersion Versao da api ex.: (2025-03 ) 
     * @param idLoja ID da loja nuvemshop
     * @param token Token de acesso 
     * @param appUrl url da integracao
     */
    constructor(baseURL: string, apiVersion: string, idLoja: string, token: string, appUrl: string) {
        this.api = axios.create({
            baseURL: `${baseURL}/${apiVersion}/${idLoja}`,
            headers: {
                'Authorization': `Bearer ${token}`,
                'User-Agent': appUrl
            }
        })
    }
}

/**
 * Monta o cliente REST da Nuvemshop a partir das variaveis de ambiente.
 * Unico ponto de entrada HTTP da integracao.
 * 
 * @returns NuvemshopApi
 * @throws Error quando alguma variavel obrigatoria nao esta definida
 */
export async function getNuvemshopApi(): Promise<NuvemshopApi> {

    const baseURL = process.env.API_BASE_URL
    const apiVersion = process.env.API_VERSION
    const idLoja = process.env.ID_LOJA
    const token = process.env.API_TOKEN
    const appUrl = process.env.APPLICATION_URL

    const obrigatorias: [string, string | undefined][] = [
        ['API_BASE_URL', baseURL],
        ['API_VERSION', apiVersion],
        ['ID_LOJA', idLoja],
        ['API_TOKEN', token],
        ['APPLICATION_URL', appUrl],
    ]

    const faltando = obrigatorias.filter(([, valor]) => !valor).map(([nome]) => nome)

    if (faltando.length > 0) {
        throw new Error(
            `Variaveis de ambiente ausentes para montar o cliente da Nuvemshop: ${faltando.join(', ')}`
        )
    }

    return new NuvemshopApi(baseURL!, apiVersion!, idLoja!, token!, appUrl!)
}