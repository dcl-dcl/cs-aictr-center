import { NextRequest, NextResponse } from 'next/server';
import { transformParameters } from '@/lib/utils/common-util';
import { ImagenApiResponse } from '@/types/ImageType';
import { GeminiModelList } from '@/constants/ImagenData';
import { Imagen, ImageGenerateParameters } from '@/lib/gcp-clients/imagen';
import { GenAIGemini } from '@/lib/gcp-clients/gemini';
import { ModelRequestHandler } from '@/lib/utils/model-request-handler';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/auth-middleware';
import { taskManagementService } from '@/lib/services/task-management-service';

const PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
const GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const GCS_BUCKET = process.env.GOOGLE_CLOUD_GCS_BUCKET;

// 初始化通用模型请求处理器
const requestHandler = new ModelRequestHandler();

// 初始化客户端实例（复用连接，提升性能）
const imagenClient = new Imagen(PROJECT, LOCATION, GOOGLE_APPLICATION_CREDENTIALS);
const geminiClient = new GenAIGemini(PROJECT, 'global', GOOGLE_APPLICATION_CREDENTIALS);

async function handleImagenRequest(request: AuthenticatedRequest): Promise<NextResponse<ImagenApiResponse>> {
    const formData = await request.formData();
    console.log("请求参数：", formData);

    const prompt = formData.get("prompt") as string;
    const modelName = formData.get("modelName") as string;
    let parameters: any = {};
    try {
        const configParamsStr = formData.get("configParameters");
        if (configParamsStr && typeof configParamsStr === 'string') {
            parameters = JSON.parse(configParamsStr);
        }
    } catch (error) {
        throw new Error(`参数转换失败:${error}`);
    }
    // 统一设置输出存储目录，Imagen 模型将直接返回 gcsUri
    parameters["storageUri"] = `${GCS_BUCKET}/imagen`;
    const result = await taskManagementService.executeTask(
        request,
        {
            username: request.user.username,
            taskFromTab: formData.get("taskFromTab") as string,
            prompt,
            model: modelName,
            parameters,
        },
        async (taskId: number) => {
            let resultImages: any[];

            if (GeminiModelList.includes(modelName)) {
                console.log("Use Gemini Model: ", modelName)
                // 从任务已保存的输入文件获取图片（统一走GCS）
                const inputFiles = await taskManagementService.getTaskInputFiles(taskId);
                const images = inputFiles.map(file => ({
                    fileUri: file.gcs_uri,
                    mimeType: file.file_mime_type || 'image/png',
                }));

                let generationConfig: any = {}
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

            // 将模型返回的 base64 图片（来自 Gemini）上传到 GCS 并返回签名URL
            resultImages = await requestHandler.processModelResponse(
                resultImages,
                {
                    taskIdPrefix: taskId.toString(),
                    uploadBase64ToGcs: true,
                    base64SubFolder: 'imagen-generate-results',
                }
            );

            if (!resultImages || resultImages.length === 0) {
                throw new Error('模型未知错误，生成图片失败')
            }

            // 为兼容性添加 filename 字段
            return resultImages.map((item, index) => ({
                ...item,
                filename: item.filename || `imagen-${taskId}-${index + 1}.png`,
            }));
        },
        formData
    );

    if (result.success) {
        return NextResponse.json({
            taskId: result.taskId.toString(),
            success: true,
            message: 'Image processing completed',
            resultData: result.resultData,
        } as ImagenApiResponse, { status: 200 });
    } else {
        return NextResponse.json({
            taskId: result.taskId.toString(),
            success: false,
            message: result.error || 'Unknown error occurred',
            resultData: null
        } as ImagenApiResponse, { status: 500 });
    }
}

export const POST = withAuth(handleImagenRequest);