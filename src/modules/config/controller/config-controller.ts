import type { Request, Response } from 'express'
import { conn2, database_api } from '../../../database/database-connection.ts'
import { ConfigRepository, type ConfigInput, type ConfigRow, type FlagConfig } from '../repository/config-repository.ts'

/** Modulo aceito na rota: minusculas, numeros e underscore (ex.: pedidos). */
const REGEX_MODULO = /^[a-z0-9_]{2,50}$/

/** Expressao cron valida: 5 campos separados por espaco. */
const REGEX_EXPRESSAO_CRON = /^\S+ \S+ \S+ \S+ \S+$/

/** Tamanho maximo da coluna expressao_cron. */
const TAMANHO_MAXIMO_EXPRESSAO = 15

/** Expressao usada quando o campo vem vazio (mesmo default da coluna). */
const EXPRESSAO_PADRAO = '*/50 * * * *'

type ResultadoConfig =
    | { ok: true, config: ConfigInput }
    | { ok: false, erro: string }

type ResultadoFlag =
    | { ok: true, flag: FlagConfig }
    | { ok: false, erro: string }

type ResultadoExpressao =
    | { ok: true, expressao: string }
    | { ok: false, erro: string }

/**
 * Controller do modulo config.
 *
 * Rotas:
 *  GET  /config                  renderiza a tela
 *  POST /api/config/:modulo      grava a configuracao do modulo
 */
export class ConfigController {

    private repository: ConfigRepository

    constructor(repository?: ConfigRepository) {
        this.repository = repository ?? new ConfigRepository(conn2, database_api)
    }

    /**
     * Renderiza a tela com um card por modulo.
     * Aqui so chega o que ja foi gravado na tabela config.
     *
     * @param _req
     * @param res
     */
    async index(_req: Request, res: Response) {
        try {
            const linhas = await this.repository.findAll()

            const configuracoes: Record<string, ConfigRow> = {}
            for (const linha of linhas) {
                configuracoes[linha.modulo] = linha
            }

            res.render('config/index', {
                configuracoes,
                activePage: 'config',
            })
        } catch (erro) {
            console.error('Erro ao carregar configuracoes:', erro)
            res.status(500).send('Erro interno ao carregar configuracoes.')
        }
    }

    /**
     * Grava a configuracao de um modulo.
     * O corpo e: { cron: true, eventos: false, expressao_cron: '0 * * * *' }.
     *
     * @param req
     * @param res
     */
    async save(req: Request, res: Response) {
        try {
            const modulo = String(req.params.modulo ?? '').trim().toLowerCase()

            if (!REGEX_MODULO.test(modulo)) {
                return res.status(400).json({ error: 'Modulo invalido.' })
            }

            const resultado = normalizarConfig(modulo, req.body)

            if (!resultado.ok) {
                return res.status(400).json({ error: resultado.erro })
            }

            await this.repository.salvar(resultado.config)

            return res.json({
                msg: `Configuracoes do modulo [${modulo}] salvas.`,
            })
        } catch (erro) {
            console.error('Erro ao salvar configuracoes:', erro)
            return res.status(500).json({ error: 'Erro interno ao salvar configuracoes.' })
        }
    }
}

/**
 * Normaliza o corpo do POST em uma linha pronta para a tabela config.
 *
 * Booleanos e as flags 'S'/'N' viram 'S'/'N', expressao vazia cai no default
 * da coluna e expressao fora do formato (ou maior que a coluna) e recusada.
 *
 * @param modulo modulo recebido na rota
 * @param corpo corpo recebido em POST /api/config/:modulo
 * @returns ResultadoConfig
 */
export function normalizarConfig(modulo: string, corpo: unknown): ResultadoConfig {
    if (typeof corpo !== 'object' || corpo === null || Array.isArray(corpo)) {
        return { ok: false, erro: 'Corpo da requisicao invalido.' }
    }

    const entrada = corpo as Record<string, unknown>

    const cron = normalizarFlag(entrada.cron, 'cron')
    if (!cron.ok) {
        return cron
    }

    const eventos = normalizarFlag(entrada.eventos, 'eventos')
    if (!eventos.ok) {
        return eventos
    }

    const expressao = normalizarExpressao(entrada.expressao_cron)
    if (!expressao.ok) {
        return expressao
    }

    return {
        ok: true,
        config: {
            modulo,
            cron: cron.flag,
            eventos: eventos.flag,
            expressao_cron: expressao.expressao,
        },
    }
}

/**
 * Converte uma flag para 'S'/'N'. Ausente vira 'N' (default da coluna).
 * @param valor valor recebido no corpo
 * @param campo nome do campo (usado na mensagem de erro)
 * @returns ResultadoFlag
 */
function normalizarFlag(valor: unknown, campo: string): ResultadoFlag {
    if (valor === undefined || valor === null || valor === '') {
        return { ok: true, flag: 'N' }
    }

    if (valor === true || valor === 'S' || valor === 's') {
        return { ok: true, flag: 'S' }
    }

    if (valor === false || valor === 'N' || valor === 'n') {
        return { ok: true, flag: 'N' }
    }

    return { ok: false, erro: `Campo [${campo}] invalido. Use S ou N.` }
}

/**
 * Valida a expressao cron. Vazia cai no default da coluna.
 * @param valor valor recebido no corpo
 * @returns ResultadoExpressao
 */
function normalizarExpressao(valor: unknown): ResultadoExpressao {
    if (valor === undefined || valor === null || valor === '') {
        return { ok: true, expressao: EXPRESSAO_PADRAO }
    }

    const expressao = String(valor).trim().replace(/\s+/g, ' ')

    if (expressao.length > TAMANHO_MAXIMO_EXPRESSAO) {
        return { ok: false, erro: `Expressao cron muito longa (maximo de ${TAMANHO_MAXIMO_EXPRESSAO} caracteres).` }
    }

    if (!REGEX_EXPRESSAO_CRON.test(expressao)) {
        return { ok: false, erro: 'Expressao cron invalida. Use o formato: minutos horas dia mes dia-da-semana.' }
    }

    return { ok: true, expressao }
}
