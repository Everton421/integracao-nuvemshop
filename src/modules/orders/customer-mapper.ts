import { type cad_clie } from "../../shared/interfaces/cad_clie.ts";
import { DateService } from "../../shared/utils/date-service.ts";
import { FormatString } from "../../shared/utils/format-string.ts";
import { ObterUf } from "../../shared/utils/obter-UF.ts";
import { StringHelper } from "../../shared/utils/string-helper.ts";
import { type NuvemshopCustomer } from "./types/types-order-request.ts";

export class CustomerMapper{
          private formatString:FormatString;
          private dateService:DateService;
   
          constructor( formatString:FormatString, dateService:DateService){
            this.formatString=formatString;
            this.dateService=dateService;
         }

   mappingByOrder( input: NuvemshopCustomer, VENDEDOR:number ){

       const formatString = new FormatString();
       const dateService = new DateService();

         const CPF = input.identification.replace(/\D/g, '');
         let fis_jur: 'F' | 'J' = 'F'

         if (CPF.length === 14) {
            fis_jur = 'J'
         }
         const state = ObterUf.transformeUf(input.default_address.province)

   const sanitize = (v: string) => StringHelper.sanitizeLatin1(v).toUpperCase();
         
      let phone = '' ;
      if(input.phone.length == 14){
            phone = formatString.formatCelular(input.phone)
         }else{
            if(input.phone.length == 13){
               phone = formatString.formatCelular(input.phone)
            }
         }
   const clientFormat = {
      APELIDO: sanitize(input.name),
      ATIVO: 'S',
      NOME: sanitize(input.name),
      BAIRRO: sanitize(input.default_address.locality),
      BLOQ_MOTIVO: '',
      CELULAR: phone ,
      CONSUMIDOR_FINAL: 'S',
      CPF: formatString.formatCpf(CPF),
      COMPLEMENTO: sanitize(input.default_address.floor),
      CEP: formatString.formatCep(input.default_address.zipcode),
      CIDADE: sanitize(input.default_address.city),
      ENDERECO: sanitize(input.default_address.address),
      ESTADO: state || '',
      FIS_JUR: fis_jur,
      NUMERO:  StringHelper.sanitizeLatin1(input.default_address.number),
      EMAIL: input.email,
      EMAIL_FISCAl: input.email,
      NO_SITE: 'S',
      HISTORICO: '',
      TELEFONE_RES:  phone ,
      DATA_CADASTRO: dateService.formatarData(input.created_at),
      DATA_RECAD: dateService.formatarDataHora(input.updated_at),
      OBS_BANCARIA: '',
      OBS_COMERCIAL1: '',
      OBS_COMERCIAL2: '',
      OBS_COMERCIAL3: '',
      OBS_PESSOAL: '',
      OBSERVACOES: '',
      RG: '',
      SENHA: '',
      VENDEDOR:  VENDEDOR,

   } as cad_clie

   return clientFormat;
   }
}
 