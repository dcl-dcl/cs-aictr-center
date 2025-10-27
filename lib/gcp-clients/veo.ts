// 参考文档:  https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/veo-video-generation?hl=zh-cn
import { GoogleAuth } from 'google-auth-library';


export interface GenerateVideoTaskResp {
    name: string;
}

export interface GenerateVideoResponse {
    name: string;
    done: boolean;
    response: {
      '@type': 'type.googleapis.com/cloud.ai.large_models.vision.GenerateVideoResponse';
      'raiMediaFilteredCount': number,
      videos: Array<{
        gcsUri: string;
        mimeType: string;
      }>;
    };
    error?: {
      code: number;
      message: string;
      status: string;
    };
}

export interface VeoGenerateParameters {
    aspectRatio?: '16:9' | '9:16';
    durationSeconds?: 8 | 7 | 6 | 5;
    personGeneration?: 'dont_allow' | 'allow_adult'; // 用于控制是否允许人物或人脸生成的安全设置
    enhancePrompt?: boolean; // 使用 Gemini 优化提示。可接受的值为 true 或 false。默认值为 true
    sampleCount?: 1 | 2 | 3 | 4;
    generateAudio?: boolean;
    negativePrompt?: string; // 一个文本字符串，用于描述您想要阻止模型生成的内容。
    resolution?: string; // 仅限 Veo 3 模型。所生成视频的分辨率。可接受的值为 720p（默认值）或 1080p。
    compressionQuality?: string; // 指定所生成视频的压缩质量。可接受的值为 "optimized"（默认值） 或 "lossless"
    seed?: number;
}

export interface imageData {
    bytesBase64Encoded?: string;
    gcsUri?: string;
    mimeType: string;
}

export class Veo{
    public static readonly DEFAULT_VEO2_MODEL = "veo-2.0-generate-001"
    public static readonly DEFAULT_VEO3_MODEL = "veo-3.0-generate-preview"

    private gcsBucketUri: string;
    private projectId: string;
    private location: string;
    private googleApplicationCredentials: string;

    constructor(
        projectId: string, location: string,
        gcsBucketUri: string,
        googleApplicationCredentials: string,
    ) {
        this.projectId = projectId;
        this.location = location;
        this.googleApplicationCredentials = googleApplicationCredentials;
        this.gcsBucketUri = gcsBucketUri;
    }

    private getEndpointBaseUrl(modelName: string): string {
        return `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${modelName}`;
    }

    async getAccessToken() : Promise<string> {
        const auth = new GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-platform'],
            projectId: this.projectId,
            keyFilename: this.googleApplicationCredentials,
            keyFile: this.googleApplicationCredentials
        });
      const client = await auth.getClient();
        const accessToken = (await client.getAccessToken()).token;
        if (accessToken) {
          return accessToken;
        } else {
          throw new Error('Failed to obtain access token.');
        }
    }

    async sendRequest<T>(
        url: string, method: string, body: any,
        accessToken?: string,
    ): Promise<T> {
        if (!accessToken) {
            accessToken = await this.getAccessToken();
        }
        console.log(`sending request to ${url}`)
        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json() as Promise<T>;
    }
    
    async checkOperation(operationName: string, modelName: string): Promise<GenerateVideoResponse> {
        const requestUrl = `${this.getEndpointBaseUrl(modelName)}:fetchPredictOperation`
        const responseJson = await this.sendRequest<GenerateVideoResponse>(
            requestUrl, 'POST', {operationName: operationName}
        )
        console.log("check Generate Video Operation Response:", responseJson)
        return responseJson as GenerateVideoResponse;
    }

    private async delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async waitForOperationWithPolling(
        operationName: string, modelName: string
    ): Promise<GenerateVideoResponse> {
        const checkInterval = 5000; // Interval for checking operation status (in milliseconds)
      
        const pollOperation = async (): Promise<GenerateVideoResponse> => {
          const generateVideoResponse = await this.checkOperation(operationName, modelName);
      
          if (generateVideoResponse.done) {
            // Check if there was an error during the operation
            if (generateVideoResponse.error) {
              throw new Error(`Operation failed with error: ${generateVideoResponse.error.message}`);
            }
            return generateVideoResponse;
          } else {
            await this.delay(checkInterval);
            return pollOperation(); // Recursive call for the next poll
          }
        };
        return pollOperation();
    }

    async waitForOperationWithoutPolling(
        operationName: string, modelName: string
    ): Promise<GenerateVideoResponse> {
        const generateVideoResponse = await this.checkOperation(operationName, modelName);
        if (generateVideoResponse.error) {
            throw new Error(`Operation failed with error: ${generateVideoResponse.error.message}`);
        } else {
            return generateVideoResponse;
        }
    }

    async generateVideo(
        modelName: string,
        prompt: string,
        image?: imageData,
        lastFrame?: imageData,
        parameters: VeoGenerateParameters = {},
    ): Promise<string> {
        // 使用传入的 modelName 或默认模型
        const videoModelName = modelName || Veo.DEFAULT_VEO3_MODEL;
        const endpointBaseUrl = this.getEndpointBaseUrl(videoModelName);
        console.log(`endpointBaseUrl: ${endpointBaseUrl}`)

        const instance: {
            prompt: string;
            image?: imageData;
            lastFrame?: imageData;
        } = {
            prompt: prompt,
        };
        if (image && (image.bytesBase64Encoded || image.gcsUri)) {
            instance.image = image
        }
        if (lastFrame && (lastFrame.bytesBase64Encoded || lastFrame.gcsUri)) {
            instance.lastFrame = lastFrame
        }

        const AccessToken = await this.getAccessToken()
        const requestUrl = `${endpointBaseUrl}:predictLongRunning`

        const maxRetries = 1; // Maximum number of retries
        const initialDelay = 1000; // Initial delay in milliseconds (1 second)
        const makeRequest = async (attempt: number) => {
          try {
            const responseJson = await this.sendRequest<GenerateVideoTaskResp>(
                requestUrl, 'POST', {
                    instances: [instance],
                    parameters: {
                        storageUri: this.gcsBucketUri,
                        ...parameters
                    },
                },
                AccessToken
            )
            console.log("Generate Video Task Response:", responseJson)
            return responseJson.name;
            
          } catch (error) {
            if (attempt < maxRetries) {
              const baseDelay = initialDelay * Math.pow(2, attempt); // Exponential backoff
              const jitter = Math.random() * 2000; // Random value between 0 and baseDelay
              const delay = baseDelay + jitter;
              console.warn(
                  `Attempt ${attempt + 1} failed. Retrying in ${delay}ms...`, 
                  error instanceof Error ? error.message : error
              );
              // await new Promise(resolve => setTimeout(resolve, delay));
              await this.delay(delay)
              return makeRequest(attempt + 1); // Recursive call for retry
            } else {
              console.error(`Failed after ${maxRetries} attempts.`, error);
              throw error; // Re-throw the error after maximum retries
            }
          }
        };
        return makeRequest(0); // Start the initial request
    }
    
    async generateVideoFromText(
        modelName: string,
        prompt: string,
        parameters: VeoGenerateParameters = {},
    ): Promise<string> {
        return this.generateVideo(modelName, prompt, undefined, undefined, parameters);
    }

    async generateVideoFromImage(
        modelName: string,
        image: imageData,
        lastFrame?: imageData,
        prompt?: string,
        parameters: VeoGenerateParameters = {},
    ): Promise<string> {
        return this.generateVideo(modelName, prompt || "", image, lastFrame, parameters);
    }
}
