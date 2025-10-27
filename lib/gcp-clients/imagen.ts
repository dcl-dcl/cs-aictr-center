import { 
    PredictionServiceClient, protos, helpers, 
 } from '@google-cloud/aiplatform';
type PredictResponse = protos.google.cloud.aiplatform.v1.IPredictResponse;
type PredictRequest = protos.google.cloud.aiplatform.v1.IPredictRequest;

export interface ImageGenerateParameters {
    negativePrompt?: string;
    sampleCount?: number;
    aspectRatio?: string;
    personGeneration?: string;
    storageUri?: string;
}

export interface InputImageData {
    bytesBase64Encoded?: string;
    gcsUri?: string;
    mimeType: string;
}

export class Imagen {
    protected client: PredictionServiceClient;
    protected modelEndpointBaseUrl: string;

    constructor(project?: string, location?: string, googleApplicationCredentials?: string) {
        project = project || process.env.GOOGLE_CLOUD_PROJECT;
        location = location || process.env.GOOGLE_CLOUD_LOCATION;
        googleApplicationCredentials = (
            googleApplicationCredentials ||
            process.env.GOOGLE_APPLICATION_CREDENTIALS
        );

        this.modelEndpointBaseUrl = `projects/${project}/locations/${location}/publishers/google/models/`;
        const clientOptions = {
            apiEndpoint: `${location}-aiplatform.googleapis.com`,
            keyFile: googleApplicationCredentials,
        };
        this.client = new PredictionServiceClient(clientOptions);
    }


    protected getFieldValue(prediction: any, fieldName: string): string | undefined {
        try {
            return prediction?.structValue?.fields?.[fieldName]?.stringValue;
        } catch (error) {
            console.warn(`获取字段 ${fieldName} 时出错:`, error);
            return undefined;
        }
    }

    protected getFieldValues(prediction: any, fieldNames: string[]): Record<string, string | undefined> {
        const result: Record<string, string | undefined> = {};
        for (const fieldName of fieldNames) {
            result[fieldName] = this.getFieldValue(prediction, fieldName);
        }
        return result;
    }

    protected parsePredictResponse(response: PredictResponse, requiredFields: string[] = ['bytesBase64Encoded', 'mimeType']) {
        const result: any[] = [];
        for (const prediction of response.predictions) {
            try {
                // console.log("prediction:", prediction, "structValue:", prediction.structValue)
                const fields = this.getFieldValues(prediction, requiredFields);
                // console.log("fields:", fields)
                result.push(fields)
                // // 检查所有必需字段是否存在
                // const hasAllRequiredFields = requiredFields.every(field => {
                //     const hasField = !!fields[field];
                //     console.log(`字段 ${field} 存在: ${hasField}, 值: ${fields[field]?.substring(0, 50)}...`);
                //     return hasField;
                // });
                // console.log("所有必需字段都存在:", hasAllRequiredFields);
                // if (hasAllRequiredFields) {
                //     const resultItem: any = {};
                //     requiredFields.forEach(field => {
                //         resultItem[field] = fields[field];
                //     });
                //     result.push(resultItem);
                //     console.log("成功添加结果项:", resultItem);
                // } else {
                //     console.log("缺少必需字段，跳过此预测结果");
                // }
            } catch (error) {
                console.error("解析预测结果时出错:", error);
            }
        }
        return result;
    }

    async generateImages(
        prompt: string,
        model: string,
        parameters: ImageGenerateParameters = {},
    ) {
        const instance: any = { prompt }
        const endpoint = this.modelEndpointBaseUrl + model;
        const request = {
            endpoint,
            instances: [helpers.toValue(instance)],
            parameters: helpers.toValue(parameters),
        }
        console.log("Send prediction to:", endpoint, "Request:", request)
        const [response] = await this.client.predict(request as PredictRequest)
        let parseFields = ['bytesBase64Encoded', 'mimeType']
        if (parameters?.storageUri) {
            parseFields = ['gcsUri', 'mimeType'];
        }
        return this.parsePredictResponse(response, parseFields);;
    }

}
