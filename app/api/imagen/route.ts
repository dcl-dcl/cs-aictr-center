import { NextRequest, NextResponse } from 'next/server';
import { transformParameters, getTaskId } from '@/utils/CommonUtil';
import { ImagenApiResponse } from '@/types/ImageType';
import { GeminiModelList } from '@/constants/ImagenData';
import { Imagen, ImageGenerateParameters } from '@/lib/imagen';
import { GenAIGemini } from '@/lib/gemini';
import { ModelRequestHandler } from '@/utils/ModelRequestHandler';
import { fileToBase64 } from '@/utils/MediaUtil';

const PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
const GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const GCS_BUCKET = process.env.GOOGLE_CLOUD_GCS_BUCKET;

// 初始化通用模型请求处理器
const requestHandler = new ModelRequestHandler();

// 初始化客户端实例（复用连接，提升性能）
const imagenClient = new Imagen(PROJECT, LOCATION, GOOGLE_APPLICATION_CREDENTIALS);
const geminiClient = new GenAIGemini(PROJECT, 'global', GOOGLE_APPLICATION_CREDENTIALS);


export async function POST(
    request: NextRequest
): Promise<NextResponse<ImagenApiResponse>> {
    const taskId = getTaskId();
    try {
        //参数准备
        const formData: any = await request.formData();
        console.log("请求参数：", formData);
        const prompt = formData.get("prompt") as string;
        const modelName = formData.get("modelName") as string;
        let parameters: any = {};
        try {
            parameters = JSON.parse(formData.get("configParameters") || "{}")
        } catch (error) {
            throw new Error(`参数转换失败:${error}`)
        }
        let resultImages: any[];

        if (GeminiModelList.includes(modelName)) {
            console.log("Use Gemini Model: ", modelName)
            const uploadedImages = formData.getAll("inputImages");
            let images: any[] = []
            if (uploadedImages.length > 0) {
                for (const image of uploadedImages) {
                    images.push({
                        data: await fileToBase64(image),
                        mimeType: image.type,
                    })
                }
            }
            let generationConfig = {}
            if (parameters.aspectRatio) {
                generationConfig = {
                    imageConfig: {
                        aspectRatio: parameters.aspectRatio,
                    }
                }
            }
            resultImages = await geminiClient.generateImageContent(
                prompt, modelName, images, generationConfig
            )

        } else {
            console.log("Use Imagen Model: ", modelName)
            parameters["storageUri"] = GCS_BUCKET + '/imagen'
            const modelReqParams = {
                modelName: modelName,
                prompt: prompt,
                parameters: transformParameters<ImageGenerateParameters>(parameters)
            }
            console.log("模型请求参数", modelReqParams)
            resultImages = await imagenClient.generateImages(
                modelReqParams.prompt, modelReqParams.modelName, modelReqParams.parameters,
            )
        }

        console.log("resultImages", resultImages)
        
        // 使用通用处理器处理模型响应
        // 可以选择是否将base64结果上传到GCS（通过uploadBase64ToGcs参数控制）
        resultImages = await requestHandler.processModelResponse(
            resultImages,
            {
                taskIdPrefix: taskId,
                uploadBase64ToGcs: false, // 设置为true可将base64结果上传到GCS并返回signedUrl
            }
        );
        
        if (!resultImages || resultImages.length === 0) {
            throw new Error('模型未知错误，生成图片失败')
        }

        return NextResponse.json({
            taskId: taskId,
            success: true,
            message: 'Image processing completed',
            resultData: resultImages,
        } as ImagenApiResponse, { status: 200 });
    } catch (error) {
        console.error(error)
        return NextResponse.json({
            taskId,
            success: false,
            message: `${error}`,
        } as ImagenApiResponse, { status: 500 });
    }
    
}