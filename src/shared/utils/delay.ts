  
  /**
   *  Função delay
   * @param ms Valor milisegundos, Ex.: 1000 ( 1 segundo ) 
   * @param service_name 
   * @returns 
   */
  export function delay(ms:number, service_name?:string) {
      return new Promise((resolve) => {
          const msg = ` Aguardando ${ms / 1000} segundos `
        const comp = service_name ? `para excutar ${service_name}...` : `...`
        console.log( msg + comp)
        setTimeout(resolve, ms)
    });
    } 

 /**
   *  Função delay
   * @param ms Valor milisegundos, Ex.: 1000 ( 1 segundo ) 
   * @param service_name 
   * @returns 
   */
export type typeDelayFunction = (ms: number, service_name?: string | undefined)=> Promise<unknown>
