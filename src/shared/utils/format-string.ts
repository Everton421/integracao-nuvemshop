    export class FormatString{

       formatCpf(cpf: string): string {
                cpf = cpf.replace(/\D/g, '');
                if (cpf.length === 11) {
                    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                } else if (cpf.length === 14) {
                    return cpf.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
                } else {
                    throw new Error('CPF inválido');
                }
            }

        formatCep( cep:string): string{

                cep = cep.replace(/\D/g, '');

                if( cep.length === 8  ){
                    return cep.replace(/(\d{5})(\d{3})/,'$1-$2'); 
                }else{
                    throw new Error('cep invalido')
                }

        }

      formatCelular(celular: string): string {
            celular = celular.replace(/\D/g, '');

            if (celular.startsWith('55') && (celular.length === 12 || celular.length === 13)) {
                celular = celular.substring(2);
            }
            if (celular.length === 11) {
                return celular.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
            } else if (celular.length === 10) {
                return celular.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
            } else {
                throw new Error('Celular inválido');
            }
        }

     formatTelefone(telefone: string): string {
            telefone = telefone.replace(/\D/g, '');
            if (telefone.startsWith('55') && telefone.length === 12) {
                telefone = telefone.substring(2);
            }
            if (telefone.length === 10) {
                return telefone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
            } else {
                throw new Error('Telefone inválido');
            }
        }
   tiraAspas(descricao: string): string {
        return descricao.replace(/['"]/g, '');
        }
    


    }
