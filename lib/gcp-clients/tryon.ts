import { Imagen, ImageGenerateParameters } from '@/lib/gcp-clients/imagen'
import { helpers } from '@google-cloud/aiplatform';

export type TryOnGenerateParameters = ImageGenerateParameters;

export interface InputImageData {
    bytesBase64Encoded?: string; // bas64 data
    gcsUri?: string;
}

export class TryOn extends Imagen {

    private readonly DefaultTryOnModelName = "virtual-try-on-preview-08-04"
    private readonly DefaultReContextModelName = "imagen-product-recontext-preview-06-30"
 
    constructor(projectId: string, location: string, googleApplicationCredentials?: string) {
        super(projectId, location, googleApplicationCredentials);
    }

    async callTryOnModel(
        personImage: InputImageData,
        productImages: Array<InputImageData>,
        model?: string,
        parameters: TryOnGenerateParameters = {},
    ) {
        if (!personImage || (productImages.length <= 0)) {
            throw new Error("必须同时提供 Person Image和Product Images");
        }
        let instance = {
            personImage: {image: personImage},
            productImages: productImages.map((i) => ({ image: i })),
        };
        const endpoint = this.modelEndpointBaseUrl + (model || this.DefaultTryOnModelName)
        console.log(">>>instance:", instance, ">>>>parameters:", parameters, ">>>endpoint:", endpoint)

        const [response] = await this.client.predict({
            endpoint: endpoint,
            instances: [helpers.toValue(instance)], 
            parameters: helpers.toValue(parameters),
        }, {
            // 设置超时时间为3分钟（180秒）
            timeout: 180000
        });
        console.log("=====================response:", response)
        return this.parsePredictResponse(response, ['bytesBase64Encoded', 'mimeType', 'gcsUri'])
    }

    async callProductRecontextModel(
        productImages: Array<InputImageData>,
        prompt?: string,
        productDescription?: string,
        model?: string,
        parameters: TryOnGenerateParameters = {},
    ) { 
        if (productImages.length <= 0) {
            throw new Error("必须提供 Product Images");
        }
        const instance: any = { 
            prompt: prompt,
            productImages: productImages.map((i) => ({ image: i })),
         };
        if (productDescription) {
            instance.productDescription = productDescription;
        }

        const endpoint = this.modelEndpointBaseUrl + (model || this.DefaultReContextModelName)
        console.log("instance:", instance, "parameters:", parameters, "endpoint:", endpoint)
        const [response] = await this.client.predict({
            endpoint: endpoint,
            instances: [helpers.toValue(instance)], 
            parameters: helpers.toValue(parameters),
        });
        return this.parsePredictResponse(response, ['bytesBase64Encoded', 'mimeType', 'gcsUri'])
    }
}

//     productImages: [
//       {
//         gcsUri: 'gs://webeye-virtual-tryon/productImages/shoes_1758266667759.jpg'
//       }
//     ],
//     prompt: 'A fashionable and well-dressed lady was sitting on the marble steps, wearing this pair of shoes',
//     productDescription: '',
//     parameters: {
//       personGeneration: 'allow_all',
//       sampleCount: 1,
//       enhancePrompt: true
//     }
// }
  
// const PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
// const LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
// const GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS;
// const GCS_BUCKET = process.env.GOOGLE_CLOUD_GCS_BUCKET;
// const tryonClient = new TryOn(PROJECT, LOCATION, GOOGLE_APPLICATION_CREDENTIALS);
// const resultImages = tryonClient.callProductRecontextModel(
//     ModelReqParams.productImages,
//     ModelReqParams.prompt,
//     ModelReqParams.productDescription,
//     undefined,
//     ModelReqParams.parameters,
// )
// console.log(resultImages)
// debugger