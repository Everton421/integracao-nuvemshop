import axios from "axios";

export async function verificarImagem(url:string) {
    try {
        const resposta = await axios.head(url);
        
        // Verifica se o status é 200 (OK)
        // E se o cabeçalho content-type indica que é uma imagem
        const isImage = resposta.headers['content-type'].startsWith('image');

        if (resposta.status === 200 && isImage) {
            console.log("✅ A imagem existe!");
            return true;
        } else {
            console.log("⚠️ A URL existe, mas não parece ser uma imagem.");
            return false;
        }
    } catch (error:any) {
        if (error.response) {
            // O servidor respondeu com um status fora do range 2xx (ex: 404, 500)
            console.log(`❌ Imagem não encontrada. Status: ${error.response.status}`);
        } else {
            // Erro de rede ou URL inválida
            console.log("❌ Erro ao conectar com o servidor:", error.message);
        }
        return false;
    }
}

 