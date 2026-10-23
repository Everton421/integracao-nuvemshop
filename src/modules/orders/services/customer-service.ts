import { CustomerMapper } from "../customer-mapper.ts";
import { CustomerRepository } from "../repositories/cutomer-repository.ts";
import { type NuvemshopCustomer } from "../types/types-order-request.ts";

export class CustomerService {
    private customerMapper: CustomerMapper;
    private customerRepository: CustomerRepository;

    constructor(customerMapper: CustomerMapper, customerRepository: CustomerRepository) {
        this.customerMapper = customerMapper;
        this.customerRepository = customerRepository;
    }

    async syncCustomer(nuvemshopCustomer: NuvemshopCustomer, VENDEDOR: number) {
        const datacustomerMapper = this.customerMapper.mappingByOrder(nuvemshopCustomer, VENDEDOR);

        // verifica se o cliente existe 
        const verifyExistsCustomer = await this.customerRepository.getCustomerByIdentification(datacustomerMapper.CPF);

        if (verifyExistsCustomer.length) {
            const { DATA_RECAD, CODIGO } = verifyExistsCustomer[0];
            if (new Date(nuvemshopCustomer.updated_at) > new Date(DATA_RECAD)) {
                // update
                const resultUpdate = await this.customerRepository.updateClientErp(datacustomerMapper, CODIGO!);
                return { success: true, message: 'Cliente Atualizado com sucesso!', data: { ...datacustomerMapper, CODIGO: CODIGO } };
            }
            return { success: true, message: `O cleinte ${datacustomerMapper.APELIDO} ja se encontra atualizado.`, data: { ...datacustomerMapper, CODIGO: CODIGO } };
        } else {
            // insert
            const resultInsert = await this.customerRepository.cadastrarClientErp(datacustomerMapper);

            return { success: true, message: `O cleinte ${datacustomerMapper.APELIDO} ja se encontra atualizado.`, data: { ...datacustomerMapper, CODIGO: resultInsert.insertId } };
        }
    }
}
