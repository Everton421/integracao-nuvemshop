import { createHash } from 'crypto';

 
export class GenerateHash {

    generateImageHash(buffer: any): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  generateImageHashFromBase64(base64: string): string {
    const clean = base64.includes('base64,') ? base64.split('base64,')[1] : base64;
    const buffer = Buffer.from(clean, 'base64');
    return this.generateImageHash(buffer);
  }

}
