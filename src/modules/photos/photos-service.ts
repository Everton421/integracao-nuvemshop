import {type typeDelayFunction } from "../../shared/utils/delay.ts";
import { PhotosRepository } from "./photos-repository.ts";
import { PhotosRequest } from "./photos-request.ts";
import { PhotosUtilities } from "./photos-utilities.ts";
import { type NuvemshopPhotoResponse } from "./types/types-photos-request.ts";

export class PhotosService {
    private photosRepository: PhotosRepository;
    private photosRequest: PhotosRequest;
    private delay: typeDelayFunction;

    constructor( photosRepository: PhotosRepository, photosRequest: PhotosRequest, delay: typeDelayFunction ){
        this.photosRepository= photosRepository;
        this.photosRequest= photosRequest;
        this.delay= delay;
    }

    /**
     *  Envia fotos do produto, a foto é enviada no formato base64.
     * @param productErp 
     * @param nuvemShopProductId 
     */
    async postBase64Photos(productErp:number, nuvemShopProductId: number){
        try {
        const photosProduct = await this.photosRepository.findPhotosProductbyParams({ product: productErp});
        for( const photo of photosProduct){
                if(photo.CAMINHO_FOTO && photo.FOTO){
                         const isPhotoExists =await PhotosUtilities.checkPhotoExists(photo.CAMINHO_FOTO)
                
                  if(!isPhotoExists){
                      console.error(`[X] Foto: ${photo.FOTO} do produto: ${productErp} não foi encontrada;`)
                         continue;
                  } 

                   const base64 = await PhotosUtilities.getBase64Photo(photo.CAMINHO_FOTO);
                  await this.delay(500, `[V] Envio Fotos Produto: ${productErp} `)
                      const responsePostPhoto = await this.photosRequest.post<NuvemshopPhotoResponse>({
                            filename: photo.CAMINHO_FOTO,
                            position: photo.SEQ,
                            attachment: base64
                        } , nuvemShopProductId )

                        await this.photosRepository.inserir({
                            codigo_produto_erp: productErp,
                            id_foto_erp: photo.id,
                            posicao: photo.SEQ,
                            nome_arquivo: photo.FOTO,
                            src: responsePostPhoto.src,
                            id_produto_nuvemshop: String(nuvemShopProductId),
                            id_foto_nuvemshop:String(responsePostPhoto.id) ,
                        })
                  
             }
         }
            return { success: true , message: '', data:null}

        } catch (error:any) {
         console.error(`[X] ERRO CRÍTICO AO TENTAR ENVIAR AS FOTOS DO PRODUTO ${productErp}, ERRO: `, error?.message || error)
             throw new Error(error)
        }
    }   

    /**
     * Exclui fotos do produto
     * @param productErp 
     * @param nuvemShopProductId 
     */
    async deletePhotos(productErp:number, nuvemShopProductId: number){
        try {
       
            const photosProduct = await this.photosRepository.findPhotosProductbyParams({ product: productErp});

            for( const photo of photosProduct){
                const photosProductNuvemshop = await this.photosRepository.findPhotosByParam({  codigo_produto_erp: productErp , posicao:photo.SEQ });
                if(photosProductNuvemshop.length ){ 
                    const {id_foto_nuvemshop }=photosProductNuvemshop[0];
                  await this.delay(500 ,`[!] Exclusão de fotos Produto: ${productErp}`)
                    const responseDelete = await this.photosRequest.delete( nuvemShopProductId, Number(id_foto_nuvemshop) );
                    if(responseDelete == 200){
                        await this.photosRepository.deleteByIdNuvemShop( Number(id_foto_nuvemshop) );
                    }
                }

            }
            return { success: true , message: '', data:null}
        } catch (error:any) {
         console.error(`[X] ERRO CRÍTICO AO TENTAR EXCLUIR AS FOTOS DO PRODUTO ${productErp}, ERRO: `, error?.message || error)
             throw new Error(error)
        }
    }

    async syncPhotosProduct( productErp:number, nuvemShopProductId: number ){
        try {
     
        const data = await this.photosRepository.findPhotosByParam( {  codigo_produto_erp :productErp })
        if(data.length){
           await this.deletePhotos(productErp, nuvemShopProductId);
        }

      await  this.postBase64Photos(productErp, nuvemShopProductId);

        } catch (error) {
            console.error(`[X] Ocorreu um erro ao tentar enviar as fotos do produto ${productErp}. `,error)
        } 
    }
}