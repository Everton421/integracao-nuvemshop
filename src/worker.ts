import { consumer_sistema } from "./shared/broker/consumer.ts"

        const eventosJob = process.env.EVENTOS
        
        if(eventosJob){
           await consumer_sistema()
        }else{
            console.log("[X]  Envio baseado em eventos desabilitado verificar process.env.EVENTOS .")
        }