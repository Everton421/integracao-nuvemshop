import assert from 'node:assert/strict'
import test from 'node:test'
import { CategoriaErpRepository } from '../repository/categoria-erp-repository.ts'
import { parseSelecao } from '../controller/categoria-controller.ts'
import { MappingCategoryToPost } from '../mapping/mapping-category.ts'
import { type CategoriaErp } from '../../../shared/interfaces/categoria-integracao.ts'
import { getNuvemshopApi } from '../../../shared/api/api.ts'

function categoria(over: Partial<CategoriaErp> = {}): CategoriaErp {
    return {
        CODIGO: 10,
        NOME: 'Joias',
        COD_GRUPO: null,
        NO_SITE: 'S',
        IMPORTADO_SITE: 'N',
        ALTERADO_SITE: 'N',
        DATA_RECAD: '2026-01-01 00:00:00',
        ATIVO: 'S',
        ...over,
    }
}

test('mapeia grupo sem parent', () => {
    const payload = MappingCategoryToPost.mappGroup(categoria())

        console.log(payload);
        
    assert.deepEqual(payload.name, { pt: 'Joias' })
    assert.equal(payload.parent, null)
})
 