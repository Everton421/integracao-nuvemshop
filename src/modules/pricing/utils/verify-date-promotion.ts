export class VerifyDatePromotion{
 
    /**
     * 
     * @param currentDate data atual.
     * @param VALID_PROM data de validade da promoção no sistema.
     * @returns 
     */         
    verify(currentDate:string, VALID_PROM:string){
            return new Date(currentDate) <= new Date(VALID_PROM);
    }
}