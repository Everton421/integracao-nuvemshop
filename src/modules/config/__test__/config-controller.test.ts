import test from 'node:test';
import assert from 'node:assert';
import { ConfigController, normalizarConfig } from '../controller/config-controller.ts';
import { type ConfigInput, type ConfigRow } from '../repository/config-repository.ts';

/** Repository falso em memoria: grava em um array, sem MySQL. */
class ConfigRepositoryFake {
    linhas: ConfigRow[] = []

    async findAll(): Promise<ConfigRow[]> {
        return this.linhas
    }

    async findByModulo(modulo: string): Promise<ConfigRow[]> {
        return this.linhas.filter((linha) => linha.modulo === modulo)
    }

    async salvar(input: ConfigInput): Promise<{ affectedRows: number }> {
        const existente = this.linhas.find((linha) => linha.modulo === input.modulo)

        if (existente) {
            existente.cron = input.cron
            existente.eventos = input.eventos
            existente.expressao_cron = input.expressao_cron
            return { affectedRows: 2 }
        }

        this.linhas.push({ id: this.linhas.length + 1, ...input })
        return { affectedRows: 1 }
    }
}

/** Response falso: captura status/render/json enviados pelo controller. */
function criarRespostaFake() {
    const res: any = {
        statusCode: 200,
        payloadRender: undefined as any,
        payloadJson: undefined as any,
        status(codigo: number) {
            this.statusCode = codigo
            return this
        },
        render(view: string, locals: any) {
            this.payloadRender = { view, locals }
            return this
        },
        json(corpo: any) {
            this.payloadJson = corpo
            return this
        },
        send(corpo: any) {
            this.payloadJson = corpo
            return this
        },
    }
    return res
}

function criarRequisicao(modulo: string, body: unknown) {
    return { params: { modulo }, body } as any
}

test("(test) Modulo config: repository e controller", async (t) => {

    await t.test(" Normalizar corpo valido ", () => {
        const resultado = normalizarConfig('pedidos', {
            cron: true,
            eventos: false,
            expressao_cron: '0 */5 * * *'
        })

        assert.strictEqual(resultado.ok, true, `Erro, corpo valido deveria ser aceito. Resultado: ${JSON.stringify(resultado)}`)

        if (resultado.ok) {
            assert.strictEqual(resultado.config.modulo, 'pedidos')
            assert.strictEqual(resultado.config.cron, 'S', `Erro, cron deveria ser S. Valor retornado: ${resultado.config.cron}`)
            assert.strictEqual(resultado.config.eventos, 'N', `Erro, eventos deveria ser N. Valor retornado: ${resultado.config.eventos}`)
            assert.strictEqual(resultado.config.expressao_cron, '0 */5 * * *')
        }
    })

    await t.test(" Corpo vazio usa os defaults da coluna ", () => {
        const resultado = normalizarConfig('produtos', {})

        assert.strictEqual(resultado.ok, true, `Erro, corpo vazio deveria ser aceito. Resultado: ${JSON.stringify(resultado)}`)

        if (resultado.ok) {
            assert.strictEqual(resultado.config.cron, 'N', `Erro, cron default deveria ser N. Valor retornado: ${resultado.config.cron}`)
            assert.strictEqual(resultado.config.eventos, 'N', `Erro, eventos default deveria ser N. Valor retornado: ${resultado.config.eventos}`)
            assert.strictEqual(resultado.config.expressao_cron, '*/50 * * * *', `Erro, expressao default inesperada. Valor retornado: ${resultado.config.expressao_cron}`)
        }
    })

    await t.test(" Expressao cron invalida e recusada ", () => {
        const semQuintoCampo = normalizarConfig('pedidos', { expressao_cron: '0 */5 * *' })
        assert.strictEqual(semQuintoCampo.ok, false, `Erro, expressao com 4 campos deveria ser recusada.`)

        const longa = normalizarConfig('pedidos', { expressao_cron: '00 00 00 * * * *' })
        assert.strictEqual(longa.ok, false, `Erro, expressao com mais de 15 caracteres deveria ser recusada.`)
    })

    await t.test(" Flag invalida e recusada ", () => {
        const resultado = normalizarConfig('pedidos', { cron: 'X' })

        assert.strictEqual(resultado.ok, false, `Erro, flag [X] deveria ser recusada.`)
    })

    await t.test(" Corpo que nao e objeto e recusado ", () => {
        const array = normalizarConfig('pedidos', ['S'])
        assert.strictEqual(array.ok, false, `Erro, corpo array deveria ser recusado.`)

        const texto = normalizarConfig('pedidos', 'cron=S')
        assert.strictEqual(texto.ok, false, `Erro, corpo texto deveria ser recusado.`)
    })

    await t.test(" save grava no repository ", async () => {
        const repository = new ConfigRepositoryFake()
        const controller = new ConfigController(repository as any)
        const res = criarRespostaFake()

        await controller.save(criarRequisicao('pedidos', { cron: true, eventos: true, expressao_cron: '*/10 * * * *' }), res)

        assert.strictEqual(res.statusCode, 200, `Erro, save deveria responder 200. Status: ${res.statusCode}`)
        assert.strictEqual(repository.linhas.length, 1, `Erro, deveria gravar 1 linha. Linhas: ${repository.linhas.length}`)

        const linha = repository.linhas[0]
        assert.strictEqual(linha.modulo, 'pedidos')
        assert.strictEqual(linha.cron, 'S')
        assert.strictEqual(linha.eventos, 'S')
        assert.strictEqual(linha.expressao_cron, '*/10 * * * *')
    })

    await t.test(" save duas vezes atualiza a mesma linha ", async () => {
        const repository = new ConfigRepositoryFake()
        const controller = new ConfigController(repository as any)

        await controller.save(criarRequisicao('produtos', { cron: true }), criarRespostaFake())
        await controller.save(criarRequisicao('produtos', { cron: false }), criarRespostaFake())

        assert.strictEqual(repository.linhas.length, 1, `Erro, modulo duplicado deveria atualizar. Linhas: ${repository.linhas.length}`)
        assert.strictEqual(repository.linhas[0].cron, 'N', `Erro, cron deveria ter sido atualizado. Valor: ${repository.linhas[0].cron}`)
    })

    await t.test(" save recusa modulo invalido ", async () => {
        const repository = new ConfigRepositoryFake()
        const controller = new ConfigController(repository as any)
        const res = criarRespostaFake()

        await controller.save(criarRequisicao('Pedidos!', {}), res)

        assert.strictEqual(res.statusCode, 400, `Erro, modulo invalido deveria responder 400. Status: ${res.statusCode}`)
        assert.strictEqual(repository.linhas.length, 0, `Erro, nada deveria ser gravado. Linhas: ${repository.linhas.length}`)
    })

    await t.test(" index agrupa as linhas por modulo ", async () => {
        const repository = new ConfigRepositoryFake()
        repository.linhas.push(
            { id: 1, modulo: 'pedidos', cron: 'S', eventos: 'N', expressao_cron: '*/50 * * * *' },
            { id: 2, modulo: 'produtos', cron: 'N', eventos: 'S', expressao_cron: '0 */5 * * *' }
        )

        const controller = new ConfigController(repository as any)
        const res = criarRespostaFake()

        await controller.index(criarRequisicao('', {}), res)

        assert.strictEqual(res.payloadRender.view, 'config/index', `Erro, view inesperada. Valor: ${res.payloadRender.view}`)

        const configuracoes = res.payloadRender.locals.configuracoes
        assert.strictEqual(configuracoes.pedidos.cron, 'S', `Erro, cron de pedidos inesperado. Valor: ${configuracoes.pedidos.cron}`)
        assert.strictEqual(configuracoes.produtos.eventos, 'S', `Erro, eventos de produtos inesperado. Valor: ${configuracoes.produtos.eventos}`)
    })
})
