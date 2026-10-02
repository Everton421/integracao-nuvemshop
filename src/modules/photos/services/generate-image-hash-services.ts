import { GenerateHash } from "../utils/generate-hash-image.ts";

export class GenerateImageHashService {

        private generateHash = new GenerateHash();

    async fromUrl(url: string): Promise<string> {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Falha ao baixar imagem: HTTP ${response.status} - ${url}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        return this.generateHash.generateImageHashFromBase64(base64);
    }

    fromBase64(base64: string): string {
        return this.generateHash.generateImageHashFromBase64(base64);
    }
}
