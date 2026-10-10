import { isAxiosError, type AxiosInstance } from "axios";
import {  type PayloadPostCategory } from "./types/types-category-request.ts";
import { RetryExecution } from "../../shared/utils/retry-request.ts";

export class PostCategoryRequest{
     
    private api:AxiosInstance;
    
    constructor( api:AxiosInstance ){
        this.api = api;
    }

     
    /**
     * Cria uma categoria nova.
     *
     * @param api cliente axios da Nuvemshop
     * @param payload corpo da categoria (name, description, parent, google_shopping_category)
     * @returns RespostaCategoriaNuvemshop
     */
      async post<T>( payload: PayloadPostCategory): Promise< T > {
                   try {
                                 
                    const response = await RetryExecution.executeWithRetry( ()=> this.api.post<T>(`/categories`, payload));
                    return response.data;
            } catch (error) {
                    if ( isAxiosError(error)) {
                        const errorData = error.response?.data;
                        const status = error.response?.status;
                        console.error(`Erro na API da Nuvemshop [Status ${status}]:`, errorData);
                        throw new Error(errorData?.message || 'Erro desconhecido na API da Nuvemshop');
                    } 
                    console.error('Erro inesperado:', error);
                    throw error;
            }
    }

    /**
     * Atualiza uma categoria existente.
     *
     * @param api cliente axios da Nuvemshop
     * @param idCategoria id devolvido pela Nuvemshop
     * @param payload corpo da categoria
     * @returns RespostaCategoriaNuvemshop
     */
      async put<T>(  idCategoria: string, payload: PayloadPostCategory)  {
            try {
                    const response = await RetryExecution.executeWithRetry( ()=> this.api.put<T>(`/categories/${idCategoria}`, payload));
                    return response.data;
            } catch (error) {
                  if ( isAxiosError(error)) {
                        const errorData = error.response?.data;
                        const status = error.response?.status;
                        console.error(`Erro na API da Nuvemshop [Status ${status}]:`, errorData);
                        throw new Error(errorData?.message || 'Erro desconhecido na API da Nuvemshop');
                    } 
                    console.error('Erro inesperado:', error);
                    throw error;
            }
    }

    /**
     * Lista as categorias da loja, paginando ate o limite da API.
     *
     * @param api cliente axios da Nuvemshop
     * @param perPage itens por pagina (a Nuvemshop aceita ate 100)
     * @param parentId quando informado, lista apenas as filhas dessa categoria
     * @returns RespostaCategoriaNuvemshop[]
     */
  //    async getAll(  perPage = 100, parentId?: number)  {
  //   
  //  }

}