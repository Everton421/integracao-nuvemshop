import axios from 'axios';
import { validateBase64 } from '../utils/validate-base64.ts';
import { DowloadImage } from './dowload-photo.ts';

export class UploadImgsService {
    private dowloadImage = new DowloadImage();

    async uploadFreeimageHost(foto: string): Promise<string | null> {

        let base64Input = foto;
        let key = process.env.API_KEY_FREEIMGHOST || '6d207e02198a847aa98d0a2a901485a5';

        if (foto.startsWith('http://') || foto.startsWith('https://')) {
              const imgDowload =  await this.dowloadImage.dowload(foto);
                if(imgDowload){
                 base64Input = imgDowload;
                }
        }

        const result = validateBase64(base64Input);

        if (!result.imageDetection.isImage) {
            console.log(`Não é uma imagem. Formato detectado: ${result.imageDetection.format}`);
            return null;
        }

        let base64Clean = String(base64Input);

        if (base64Clean.includes('base64,')) {
            base64Clean = base64Clean.split('base64,')[1];
        }
        const params = new URLSearchParams();
        params.append('key', key);
        params.append('source', base64Clean); // Envia a string limpa
        params.append('format', 'json');

        try {
            console.log("Iniciando upload para FreeImage.host...");
            const response = await axios.post('https://freeimage.host/api/1/upload', params);

            if (response.data && response.data.image && response.data.image.url) {
                console.log('Upload realizado com sucesso:', response.data.image.url);
                return response.data.image.url;
            } else {
                throw new Error("Retorno inesperado da API de Imagem");
            }

        } catch (error: any) {
            console.error('Erro no upload FreeImage:', error.response?.data || error.message);
            throw new Error('Falha ao fazer upload da imagem: ' + (error.response?.data?.error?.message || error.message));
        }
    }



    async uploadIMGBB(foto: string): Promise<string | null> {
            let base64Input = foto;
           if (foto.startsWith('http://') || foto.startsWith('https://')) {
              const imgDowload =  await this.dowloadImage.dowload(foto);
                if(imgDowload){
                 base64Input = imgDowload;
                }
          }

          //  const result = validateBase64(base64Input);
          //  if (!result.imageDetection.isImage) {
          //      console.log(`Não é uma imagem. Formato detectado: ${result.imageDetection.format}`);
          //      return null
          //  }

            let base64Clean = String(base64Input);
            if (base64Clean.includes('base64,')) {
                base64Clean = base64Clean.split('base64,')[1];
            }
            if (!process.env.API_KEY_IMGBB) {
                console.log(" API_KEY_IMGBB não foi configurada.")
                return null
            }

            const apiKey = process.env.API_KEY_IMGBB

            const form = new FormData();
            form.append('image', base64Clean);

            try {
                const response = await axios.post(`https://api.imgbb.com/1/upload?key=${apiKey}`, form, {
                        timeout: 60000,  
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                return response.data.data.url;
            } catch (error: any) {
                throw error;
            }

    }

}
