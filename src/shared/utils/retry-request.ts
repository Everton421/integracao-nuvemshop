import { delay } from "./delay.ts";

/** 
 * secondsToTryAgain: tempo  para tentar novamente default (1) 
 * maxRetries?:   numero maximo de execusão  ( default 5 )
 */
export type RetryExecutionOptions = {
    secondsToTryAgain?:number // tempo para tentar novamente 
    maxRetries?: number // numero maximo de execusão  ( default 5 )
}

export class RetryExecution {

  static async executeWithRetry<T>(request: () => Promise<T>, options?: RetryExecutionOptions): Promise<T> {
    const maxRetries = options?.maxRetries ?? 5;
    const secondsToTryAgain = options?.secondsToTryAgain ?? 1;

    let tentativas = 0;

    for (;;) {
      try {
        return await request();
      } catch (e: any) {
        if (e?.response?.status === 429) {
          if (tentativas >= maxRetries) {
            console.error(`[429] Limite de ${maxRetries} tentativas atingido, reenviando erro.`);
            throw e;
          }
          tentativas++;
          await RetryExecution.waitThrottle(secondsToTryAgain);
          continue;
        }
        throw e;
      }
    }
  }

 

  static async waitThrottle(segundos: number): Promise<void> {
    console.log(`[429] Aguardando ${segundos} segundos para tentar novamente...`);
    await delay(segundos * 1000);
  }
}