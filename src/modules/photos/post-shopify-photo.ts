import { database_api } from "../../database/database-connection.ts";
import { getShopify } from "../../shared/api/api.ts";
import { delay } from "../../shared/utils/delay.ts";
import { FotosEnvioShopifyRepository } from "./repository/fotos-envio-shopify-repository.ts";
import { GenerateImageHashService } from "./services/generate-image-hash-services.ts";
import { FotosProdutoIntegration } from "./repository/photos-products-repository.ts";
import { ProdutoIntegration } from "../products/repository/produto-integration-repository.ts";
import { UploadMediaForShopifyRequest } from "./request/upload-media-for-shopify-request.ts";

type resultVerifyShopifyPhotos = {
     node: {
    id: string,
    sku: string,
    image: {
      url:string,
       altText:string,
      },
    product: {
      id: string,
      title: string,
      images:{    
       edges: [
         node: { 
                url: string,
                altText: string,
             }
          ]
        }
    }
  }
}

export class PostShopifyPhoto {
    
    private fotosProdutoIntegration = new FotosProdutoIntegration();
    private fotosEnvioRepo = new FotosEnvioShopifyRepository();
    private hashService = new GenerateImageHashService();
    private produtoIntegrationRepository = new ProdutoIntegration();


    private database = `\`${database_api}\``

    async sync(shopifyProductId: string, erp_sku: number): Promise<{ added: number }> {
        const fotosEsperadas = await this.fotosProdutoIntegration
            .selectByParam({ erp_sku: String(erp_sku), ativo: 'S' });

        const fotosComLink = fotosEsperadas.filter(f => f.link);

        if (fotosComLink.length === 0) return { added: 0 };

        const jaEnviadas = await this.fotosEnvioRepo.findByErpSku(erp_sku);
        const hashesEnviadas = new Set(
            jaEnviadas.map(f => f.hash_sha256).filter(Boolean)
        );

        const novas: { link: string; hash: string }[] = [];

        for (const foto of fotosComLink) {
            let hash = foto.hash_sha256;

            if (!hash) {
                try {
                    hash = await this.hashService.fromUrl(foto.link!);
                    await this.fotosProdutoIntegration.update({
                        id: foto.id,
                        erp_sku: Number(foto.erp_sku),
                        hash_sha256: hash
                    });
                } catch {
                    continue;
                }
            }

            if (!hashesEnviadas.has(hash)) {
                novas.push({ link: foto.link!, hash });
            }
        }

        if (novas.length === 0) return { added: 0 };

        const mediaInput = novas.map(f => ({
            originalSource: f.link,
            alt: '',
            mediaContentType: "IMAGE" as const
        }));

        const mediaCriadas = await UploadMediaForShopifyRequest.appendMediaToShopify(shopifyProductId, mediaInput, erp_sku);
        if (!mediaCriadas) return { added: 0 };

        for (let i = 0; i < mediaCriadas.length; i++) {
            const m = mediaCriadas[i];
            const foto = novas[i];
            if (foto) {
                await this.fotosEnvioRepo.insert({
                    erp_sku: String(erp_sku),
                    hash_sha256: foto.hash,
                    media_id: m.id,
                    original_source: foto.link
                });
            }
        }

        return { added: mediaCriadas.length };
    }


    async postphotosbyOldSite(erp_sku: number) {

        const photosOldSite = await this.fotosProdutoIntegration.selectPhotosOldSite({ sku: erp_sku })

        const fotosComLink = photosOldSite.filter(f => f.gallery);

        if (fotosComLink.length === 0) return { added: 0 };

        const dataProduct = await this.produtoIntegrationRepository.selectByParam({ erp_sku: String(erp_sku) });

        const { shopify_product_id } = dataProduct[0];

        const mediaIds = await this.getProductMediaIds(shopify_product_id);
        if (mediaIds && mediaIds.length > 0) {
            await this.deleteMediaFromShopify(shopify_product_id, mediaIds, erp_sku);
        }

        const mediaInput = fotosComLink.map(f => ({
            originalSource: f.gallery!,
            alt: '',
            mediaContentType: "IMAGE" as const
        }));

        const mediaCriadas = await UploadMediaForShopifyRequest.appendMediaToShopify(shopify_product_id, mediaInput, erp_sku);
        if (mediaCriadas) {
            console.log(`Mídias adicionadas SKU ${erp_sku}:`, mediaCriadas);
        }

    }

    

   private async getProductMediaIds(shopifyProductId: string): Promise<string[] | null> {
        const shopify = await getShopify();

        const query = `
            query getProductMedia($productId: ID!) {
                product(id: $productId) {
                    media(first: 100) {
                        edges {
                            node {
                                id
                            }
                        }
                    }
                }
            }
        `;

        const { data, errors } = await shopify.request(query, {
            variables: { productId: shopifyProductId }
        });

        if (errors) {
            console.log(`Erro ao buscar mídias do produto ${shopifyProductId}:`, errors);
            return null;
        }

        const edges = data?.product?.media?.edges;
        if (!edges || edges.length === 0) return [];

        return edges.map((e: { node: { id: string } }) => e.node.id);
    }

    private async deleteMediaFromShopify(
        shopifyProductId: string, mediaIds: string[], erp_sku: number
    ): Promise<string[] | null> {
        const shopify = await getShopify();

        const mutation = `
            mutation productDeleteMedia($productId: ID!, $mediaIds: [ID!]!) {
                productDeleteMedia(productId: $productId, mediaIds: $mediaIds) {
                    deletedMediaIds
                    userErrors { field message }
                }
            }
        `;

        const { data, errors } = await shopify.request(mutation, {
            variables: {
                productId: shopifyProductId,
                mediaIds
            }
        });

        if (errors) {
            console.log(`Erro ao deletar mídia SKU ${erp_sku}:`, errors);
            return null;
        }

        const userErrors = data?.productDeleteMedia?.userErrors;
        if (userErrors && userErrors.length > 0) {
            console.log(`Erros de validação ao deletar mídia SKU ${erp_sku}:`, userErrors);
            return null;
        }

        return data?.productDeleteMedia?.deletedMediaIds || null;
    }
}
