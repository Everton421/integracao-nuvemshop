
import  { test } from 'node:test';
import { PedidoRepository } from '../repository/pedido-repository.ts';

    test.it( " (test) pedidosFaturados",async ()=>{
        
        const data = await PedidoRepository.pedidosFaturados(1935529);

        console.log(data);
    })