import test from 'node:test';
import assert from 'node:assert';
import { OrderIntegrationMapper } from '../order-integration-mapper.ts';
import { type NuvemshopOrder } from '../types/types-order-request.ts';

function criarPedidoNuvemshop(): NuvemshopOrder {
    return {
        id: 123456,
        contact_name: 'Maria Silva',
        total: '250.90',
        status: 'open',
        payment_status: 'paid'
    } as unknown as NuvemshopOrder;
}

test("(test) Mapear pedido da Nuvemshop para a tabela pedidos", async (t) => {

    const mapper = new OrderIntegrationMapper();

    await t.test(" Pedido aberto e pago ", () => {
        const pedido = mapper.toPedidoIntegracao(criarPedidoNuvemshop(), 10, 900);

        assert.strictEqual(pedido.id_nuvemshop, '123456', `Erro, id_nuvemshop inesperado. Valor retornado: ${pedido.id_nuvemshop} Valor Esperado: 123456`)
        assert.strictEqual(pedido.codigo_pedido_erp, 900, `Erro, codigo_pedido_erp inesperado. Valor retornado: ${pedido.codigo_pedido_erp} Valor Esperado: 900`)
        assert.strictEqual(pedido.codigo_cliente_erp, 10, `Erro, codigo_cliente_erp inesperado. Valor retornado: ${pedido.codigo_cliente_erp} Valor Esperado: 10`)
        assert.strictEqual(pedido.nome_cliente, 'Maria Silva', `Erro, nome_cliente inesperado. Valor retornado: ${pedido.nome_cliente} Valor Esperado: Maria Silva`)
        assert.strictEqual(pedido.status_nuvenshop, 'open/paid', `Erro, status_nuvenshop inesperado. Valor retornado: ${pedido.status_nuvenshop} Valor Esperado: open/paid`)
        assert.strictEqual(pedido.total, 250.9, `Erro, total inesperado. Valor retornado: ${pedido.total} Valor Esperado: 250.9`)
    })

    await t.test(" Pedido cancelado e reembolsado ", () => {
        const nuvemshopOrder = criarPedidoNuvemshop();
        nuvemshopOrder.status = 'cancelled';
        nuvemshopOrder.payment_status = 'refunded';

        const pedido = mapper.toPedidoIntegracao(nuvemshopOrder, 20, 901);

        assert.strictEqual(pedido.status_nuvenshop, 'cancelled/refunded', `Erro, status_nuvenshop inesperado. Valor retornado: ${pedido.status_nuvenshop} Valor Esperado: cancelled/refunded`)
        assert.ok(pedido.status_nuvenshop.length <= 50, `Erro, status_nuvenshop maior que o tamanho da coluna (varchar(50)). Valor retornado: ${pedido.status_nuvenshop}`)
    })

    await t.test(" Total convertido para numero ", () => {
        const nuvemshopOrder = criarPedidoNuvemshop();
        nuvemshopOrder.total = '0.5';

        const pedido = mapper.toPedidoIntegracao(nuvemshopOrder, 10, 900);

        assert.strictEqual(typeof pedido.total, 'number', `Erro, total deveria ser number. Valor retornado: ${typeof pedido.total}`)
        assert.strictEqual(pedido.total, 0.5, `Erro, total inesperado. Valor retornado: ${pedido.total} Valor Esperado: 0.5`)
    })

})
