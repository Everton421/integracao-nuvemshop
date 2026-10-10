import type { Request, Response } from 'express'
import { conn2, database_api } from '../../../database/database-connection.ts'
import { ConfigRepository } from '../repository/config-repository.ts'

/** Modulo aceito na rota: minusculas, numeros e underscore (ex.: categorias). */
const REGEX_MODULO = /^[a-z0-9_]{2,50}$/

/** Chave de configuracao aceita no corpo do POST. */
const REGEX_CHAVE = /^[a-z0-9_]{1,100}$/

/** Tamanho maximo do valor gravado, o mesmo da coluna valor. */
const TAMANHO_MAXIMO_VALOR = 500

/**
 * Controller do modulo config.
 *
 * Rotas:
 *  GET  /config                  renderiza a tela
 *  POST /api/config/:modulo      grava as configuracoes do modulo
 */
export class ConfigController {

    private repository: ConfigRepository

    constructor(repository?: ConfigRepository) {
        this.repository = repository ?? new ConfigRepository(conn2, database_api)
    }

    /**
     * Renderiza a tela com um card por modulo.
     * Os campos ficam declarados na view; aqui so chega o que ja foi gravado.
     *
     * @param _req
     * @param res
     */
    async index(_req: Request, res: Response) {
        try {
            const configuracoes = await this.repository.findAll()

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
     * Grava as configuracoes de um modulo.
     * O corpo e um objeto simples: { enviar_produtos: 'S', tabela_preco: '3' }.
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

            const valores = normalizarCampos(req.body)
            const quantidade = await this.repository.salvar(modulo, valores)

            return res.json({
                msg: `Configuracoes do modulo [${modulo}] salvas (${quantidade} campo(s)).`,
            })
        } catch (erro) {
            console.error('Erro ao salvar configuracoes:', erro)
            return res.status(500).json({ error: 'Erro interno ao salvar configuracoes.' })
        }
    }
}

/**
 * Normaliza o corpo do POST em um mapa chave -> valor pronto para o banco.
 *
 * Booleanos viram 'S'/'N' para bater com o padrao das demais configuracoes,
 * chaves fora do padrao sao descartadas e valores sao limitados ao tamanho da coluna.
 *
 * @param corpo corpo recebido em POST /api/config/:modulo
 * @returns Record<string, string>
 */
function normalizarCampos(corpo: unknown): Record<string, string> {
    if (typeof corpo !== 'object' || corpo === null || Array.isArray(corpo)) {
        return {}
    }

    const valores: Record<string, string> = {}

    for (const [chave, valor] of Object.entries(corpo as Record<string, unknown>)) {
        const chaveLimpa = chave.trim().toLowerCase()

        if (!REGEX_CHAVE.test(chaveLimpa)) {
            continue
        }

        let texto: string
        if (typeof valor === 'boolean') {
            texto = valor ? 'S' : 'N'
        } else if (valor === null || valor === undefined) {
            texto = ''
        } else {
            texto = String(valor).trim()
        }

        valores[chaveLimpa] = texto.slice(0, TAMANHO_MAXIMO_VALOR)
    }

    return valores
}