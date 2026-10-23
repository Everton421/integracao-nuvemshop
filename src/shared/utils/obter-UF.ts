export class ObterUf{
    static transformeUf(estado:string){
          if (!estado) return null;
            const estadoNormalizado = estado
                    .trim()
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "");

                const estados:any = {
                    "acre": "AC",
                    "alagoas": "AL",
                    "amapa": "AP",
                    "amazonas": "AM",
                    "bahia": "BA",
                    "ceara": "CE",
                    "distrito federal": "DF",
                    "espirito santo": "ES",
                    "goias": "GO",
                    "maranhao": "MA",
                    "mato grosso": "MT",
                    "mato grosso do sul": "MS",
                    "minas gerais": "MG",
                    "para": "PA",
                    "paraiba": "PB",
                    "parana": "PR",
                    "pernambuco": "PE",
                    "piaui": "PI",
                    "rio de janeiro": "RJ",
                    "rio grande do norte": "RN",
                    "rio grande do sul": "RS",
                    "rondonia": "RO",
                    "roraima": "RR",
                    "santa catarina": "SC",
                    "sao paulo": "SP",
                    "sergipe": "SE",
                    "tocantins": "TO"
                }   

                return estados[estadoNormalizado] as string   || "Estado não encontrado";
    }
}