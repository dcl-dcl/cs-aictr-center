import { GoogleGenAI, GenerateContentConfig } from '@google/genai';
import { VertexAI, GenerationConfig } from '@google-cloud/vertexai';


export interface ImageData {
    data?: string; // bas64 data
    gcsUri?: string;
    mimeType: string;
}

const defaultGenerationConfig = {
    // maxOutputTokens: 65535,
    temperature: 1,
    topP: 0.95,
    safetySettings: [
        {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "OFF"
        },
        {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "OFF"
        },
        {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "OFF"
        },
        {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "OFF"
        },
        {
            category: "HARM_CATEGORY_IMAGE_HATE",
            threshold: "OFF"
        },
        {
            category: "HARM_CATEGORY_IMAGE_DANGEROUS_CONTENT",
            threshold: "OFF"
        },
        {
            category: "HARM_CATEGORY_IMAGE_HARASSMENT",
            threshold: "OFF"
        },
        {
            category: "HARM_CATEGORY_IMAGE_SEXUALLY_EXPLICIT",
            threshold: "OFF"
        }
    ],
};


export class GenAIGemini {
    private project: string
    private location: string
    private aiClient: any


    constructor(
        project?: string, location?: string,
        googleApplicationCredentials?: string
    ) {
        this.project = project || (process.env.GOOGLE_CLOUD_PROJECT as string)
        this.location = location || (process.env.GOOGLE_CLOUD_LOCATION as string)
        googleApplicationCredentials = googleApplicationCredentials || (process.env.GOOGLE_APPLICATION_CREDENTIALS as string)
        this.aiClient = new GoogleGenAI({
            vertexai: true,
            project: this.project,
            location: this.location,
            // googleAuthOptions: {
            //     keyFilename: googleApplicationCredentials,
            //     keyFile: googleApplicationCredentials,
            // }
        })
        console.log(`Gemini SDK 在项目 '${project}' 和区域 '${location}' 初始化成功。`)
    }

    public getAiClient() {
        return this.aiClient
    }

    async parseTextStream(stream: any) {
        let fullText = '';
        for await (const chunk of stream) {
            if (chunk.candidates && chunk.candidates[0] && chunk.candidates[0].content) {
                const parts = chunk.candidates[0].content.parts || [];
                for (const part of parts) {
                    if (part.text) {
                        fullText += part.text;
                    }
                }
            }
        }
        return fullText;
    }

    async parseImageStream(stream: any) {
        const generateImages: any[] = []
        let text: string = "";
        for await (const chunk of stream) {
            if (chunk.candidates && chunk.candidates[0] && chunk.candidates[0].content) {
                const parts = chunk.candidates[0].content.parts || [];
                for (const part of parts) {
                    if (part?.text) {
                        text += part.text;
                    } else if (part?.inlineData?.data){
                        generateImages.push({
                            mimeType: part.inlineData.mimeType,
                            bytesBase64Encoded: part.inlineData.data,
                        })
                    }
                }
            }
        }
        return {text, generateImages}
    }

    async generateContent(
        prompt: string,
        model: string,
        images?: Array<ImageData>,
        generationConfig?: GenerateContentConfig,
    ) {
        let contents;
        if (images && images.length > 0) {
            const parts = [];
            images.forEach(image => {
                parts.push({
                    inlineData: image
                });
            });
            parts.push({
                text: prompt
            });
            contents = {
                role: "user",
                parts: parts
            };

        } else {
            contents = prompt;
        }
        console.log("contents:", contents, "config:", generationConfig)
        const response = await this.aiClient.models.generateContentStream({
            model: model,
            contents: contents,
            config: generationConfig || defaultGenerationConfig,
        })
        return response
    }

    async generateTextContent(
        prompt: string, model: string,
        generationConfig: GenerateContentConfig = {},
    ): Promise<string> {
        if (generationConfig) {
            generationConfig.responseModalities = ['TEXT']
        } else {
            generationConfig = {
                responseModalities: ['TEXT'],
            } as GenerateContentConfig
        }
        const stream = await this.generateContent(
            prompt, model, undefined,
            generationConfig
        )
        const fullText = this.parseTextStream(stream)
        return fullText;
    }

    async generateImageContent(
        prompt: string,
        model: string,
        images?: Array<ImageData>,
        generationConfig: GenerateContentConfig = {},
    ) {
        generationConfig = {
            ...defaultGenerationConfig,
            responseModalities: ['TEXT', 'IMAGE'],
            maxOutputTokens: 32768,
            ...generationConfig,
        } as GenerateContentConfig
        const response = await this.generateContent(
            prompt, model, images,
            generationConfig
        )
        const {text, generateImages} = await this.parseImageStream(response)
        if (generateImages.length <= 0) {
            throw new Error(`模型生成图片失败，${text}`)
        }
        return generateImages
    }

}

export class VertexAIGemini {
    private vertexAI: VertexAI;
    private readonly DefaultModelName = "gemini-2.5-flash";

    constructor(projectId: string, location: string, googleApplicationCredentials?: string) {
        this.vertexAI = new VertexAI({
            project: projectId,
            location: location,
            googleAuthOptions: {
                keyFile: googleApplicationCredentials
            }
        });
    }

    async generateTextContent(
        prompt: string,
        modelName: string = this.DefaultModelName,
        generationConfig: GenerationConfig = {}
    ): Promise<any> {
        const model = this.vertexAI.getGenerativeModel({
            model: modelName,
            generationConfig: generationConfig,
        });

        const result = await model.generateContent(prompt);
        return result;
    }

    async parsePredictResponse(response: any): Promise<string[]> {
        try {
            const candidates = response.response?.candidates || [];
            return candidates.map((candidate: any) => {
                const parts = candidate.content?.parts || [];
                return parts.map((part: any) => part.text || '').join('');
            }).filter((text: string) => text.length > 0);
        } catch (error) {
            console.error('Error parsing response:', error);
            return [];
        }
    }
}
