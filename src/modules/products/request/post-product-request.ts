import { type AxiosInstance, isAxiosError } from "axios";

export class PostProductRequest{

    static async post<T>(api:AxiosInstance, payload: any ) {
            try {
                    const data = await api.post<T>("/products", payload);
                    return data.data;
            } catch (error) {
                if( isAxiosError(error)){
                   return error.response?.data
                   }else{
                   return error
                   } 
            }
    }
}