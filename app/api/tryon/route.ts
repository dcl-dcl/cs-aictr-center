import { NextRequest, NextResponse } from 'next/server';
import { transformParameters, getTaskId } from '@/lib/utils/common-util';
import { TryOnApiResponse } from '@/types/TryonType';
import { TryonModelList } from '@/constants/TryonData';
import { TryOn, TryOnGenerateParameters } from '@/lib/gcp-clients/tryon';
import { ModelRequestHandler } from '@/lib/utils/model-request-handler';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/auth-middleware';
import { taskManagementService } from '@/lib/services/task-management-service';

// 初始化通用模型请求处理器
const requestHandler = new ModelRequestHandler();

const PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
const GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const GCS_BUCKET = process.env.GOOGLE_CLOUD_GCS_BUCKET;

// 初始化 TryOn 客户端（复用连接，提升性能）
const tryonClient = new TryOn(PROJECT, LOCATION, GOOGLE_APPLICATION_CREDENTIALS);


async function handleTryOnRequest(request: AuthenticatedRequest): Promise<NextResponse<TryOnApiResponse>> {
    const formData = await request.formData();
    console.log("请求参数：", formData);
    
    const modelName = formData.get("modelName") as string;
    const prompt = formData.get("prompt") as string;
    const productDescription = formData.get("productDescription") as string;
    
    let parameters: any = {};
    try {
        const configParamsStr = formData.get("ConfigParameters");
        if (configParamsStr && typeof configParamsStr === 'string') {
            parameters = JSON.parse(configParamsStr);
        }
    } catch (error) {
        throw new Error(`参数转换失败:${error}`);
    }
    parameters["storageUri"] = GCS_BUCKET + '/tryon-generate-results';

    // 使用任务管理服务执行完整的任务流程
    const result = await taskManagementService.executeTask(
        request,
        {
            username: request.user.username,
            taskFromTab: formData.get("taskFromTab") as string,
            prompt: prompt,
            model: modelName,
            parameters: parameters
        },
        async (taskId: number) => {
            // 获取已上传的输入文件
            const inputFiles = await taskManagementService.getTaskInputFiles(taskId);
            
            // 模型执行逻辑
            let resultImages: any[];
            
            if (TryonModelList.includes(modelName)) {
                // 从输入文件中获取person和product图片
                const personFiles = inputFiles.filter(file => file.gcs_uri.includes('/person/'));
                const productFiles = inputFiles.filter(file => file.gcs_uri.includes('/product/'));
                
                if (personFiles.length === 0 || productFiles.length === 0) {
                    throw new Error('Missing required person or product images');
                }
                
                const ModelReqParams = {
                    personImage: { gcsUri: personFiles[0].gcs_uri },
                    productImages: [{ gcsUri: productFiles[0].gcs_uri }],
                    parameters: transformParameters<TryOnGenerateParameters>(parameters)
                }
                console.log("ModelReqParams:", ModelReqParams)
                resultImages = await tryonClient.callTryOnModel(
                    ModelReqParams.personImage,
                    ModelReqParams.productImages,
                    modelName,
                    ModelReqParams.parameters,
                )
            } else {
                // 从输入文件中获取product图片
                const productFiles = inputFiles.filter(file => file.gcs_uri.includes('/product/'));
                if (productFiles.length === 0) {
                    throw new Error('Missing required product images');
                }
                const ModelReqParams = {
                    productImages: productFiles.map(file => ({ gcsUri: file.gcs_uri })),
                    prompt: prompt,
                    productDescription: productDescription || "",
                    parameters: transformParameters<TryOnGenerateParameters>(parameters)
                }
                console.log("ModelReqParams:", ModelReqParams)
                resultImages = await tryonClient.callProductRecontextModel(
                    ModelReqParams.productImages,
                    ModelReqParams.prompt,
                    ModelReqParams.productDescription,
                    modelName,
                    ModelReqParams.parameters,
                )
            }
            console.log("resultImages:", resultImages)
            
            // 使用通用处理器处理模型响应
            // 对于TryOn，通常希望将结果上传到GCS以获得持久化URL
            resultImages = await requestHandler.processModelResponse(
                resultImages,
                {
                    taskIdPrefix: taskId.toString(),
                    uploadBase64ToGcs: true, // 如果返回base64 TryOn结果上传到GCS
                    base64SubFolder: 'tryon-generate-results'
                }
            );
            
            // 为兼容性添加filename字段
            return resultImages.map((item, index) => ({
                ...item,
                filename: item.filename || `tryon-${taskId}-${index + 1}.png`,
            }));
        },
        formData
    );

    if (result.success) {
        return NextResponse.json({
            taskId: result.taskId.toString(),
            success: true,
            message: 'success',
            resultData: result.resultData
        } as TryOnApiResponse, { status: 200 });
    } else {
        return NextResponse.json({
            taskId: result.taskId.toString(),
            success: false,
            message: result.error || 'Unknown error occurred',
            resultData: null
        } as TryOnApiResponse, { status: 500 });
    }
}

export const POST = withAuth(handleTryOnRequest);

