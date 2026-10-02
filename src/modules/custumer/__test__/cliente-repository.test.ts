
import test from 'node:test';
import { ClienteRepository } from '../cliente-repository.ts';
import assert from 'node:assert';

test.it(" [ test ] ClienteRepository.buscaPorcnpj ", async ()=>{

        const cnpj = "079.945.189-40"
            const validCliente = await ClienteRepository.buscaPorcnpj(cnpj);
    
                const dataClientErp = validCliente[0];
                console.log(dataClientErp);

                assert.strictEqual(String(dataClientErp.CPF) , cnpj );
    
})