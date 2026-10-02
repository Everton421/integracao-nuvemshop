import { type cad_clie } from "../../shared/interfaces/cad_clie.ts";
import { DateService } from "../../shared/utils/date-service.ts";
import { FormatString } from "../../shared/utils/format-string.ts";
import { StringHelper } from "../../shared/utils/string-helper.ts";
import { type clientRequest } from "../orders/get-order-request.ts";

export function cad_clie_mapper(cliente: clientRequest) {

   const formatString = new FormatString();
   const dateService = new DateService();

   const aux = cliente.cnpj.replace(/\D/g, '');
   let fis_jur: 'F' | 'J' = 'F'

   if (aux.length === 14) {
      fis_jur = 'J'
   }

   const sanitize = (v: string) => StringHelper.sanitizeLatin1(v).toUpperCase();

   const clientFormat = {
      APELIDO: sanitize(cliente.nome),
      ATIVO: 'S',
      NOME: sanitize(cliente.nome),
      BAIRRO: sanitize(cliente.bairro),
      BLOQ_MOTIVO: '',
      CELULAR:  cliente.celular ,
      CONSUMIDOR_FINAL: 'S',
      CPF: formatString.formatCpf(cliente.cnpj),
      COMPLEMENTO: sanitize(cliente.complemento),
      CEP: formatString.formatCep(cliente.cep),
      CIDADE: sanitize(cliente.cidade),
      ENDERECO: sanitize(cliente.rua),
      ESTADO: cliente.uf,
      FIS_JUR: fis_jur,
      NUMERO:  StringHelper.sanitizeLatin1(cliente.numero),
      EMAIL: cliente.email,
      EMAIL_FISCAl: cliente.email,
      NO_SITE: 'S',
      HISTORICO: '',
      TELEFONE_RES:  cliente.telefone ,
      DATA_CADASTRO: dateService.obterDataAtual(),
      DATA_RECAD: dateService.obterDataHoraAtual(),
      OBS_BANCARIA: '',
      OBS_COMERCIAL1: '',
      OBS_COMERCIAL2: '',
      OBS_COMERCIAL3: '',
      OBS_PESSOAL: '',
      OBSERVACOES: '',
      RG: '',
      SENHA: '',
      VENDEDOR: cliente.vendedor,

   } as cad_clie

   return clientFormat;
}
