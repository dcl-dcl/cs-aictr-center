import { NextRequest, NextResponse } from 'next/server';
import { transformParameters, getTaskId } from '@/utils/CommonUtil';
import { TryOnApiResponse } from '@/types/TryonType';
import { TryonModelList } from '@/constants/TryonData';
import { TryOn, TryOnGenerateParameters } from '@/lib/tryon';
import { ModelRequestHandler } from '@/utils/ModelRequestHandler';

// 初始化通用模型请求处理器
const requestHandler = new ModelRequestHandler();

const PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
const GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const GCS_BUCKET = process.env.GOOGLE_CLOUD_GCS_BUCKET;

// 初始化 TryOn 客户端（复用连接，提升性能）
const tryonClient = new TryOn(PROJECT, LOCATION, GOOGLE_APPLICATION_CREDENTIALS);


export async function POST(
    request: NextRequest
): Promise<NextResponse<TryOnApiResponse>> {
    const taskId = getTaskId();
    try {
        //参数准备
        const formData: any = await request.formData();
        console.log("请求参数：", formData);
        const modelName = formData.get("modelName") as string;
        let parameters: any = {};
        try {
            parameters = JSON.parse(formData.get("ConfigParameters") || "{}")
        } catch (error) {
            throw new Error(`参数转换失败:${error}`)
        }
        parameters["storageUri"] = GCS_BUCKET + '/tryon-generate-results'

        let resultImages: any[];
        if (TryonModelList.includes(modelName)) {
            // 使用通用处理器处理文件（>=10MB上传GCS，<10MB转base64）
            const personResult = await requestHandler.processFileForModelRequest(
                formData.getAll("personImages")[0], 
                { subFolder: "personImages" }
            );
            const productResult = await requestHandler.processFileForModelRequest(
                formData.getAll("productImages")[0], 
                { subFolder: "productImages" }
            );
            
            const ModelReqParams = {
                personImage: personResult.imageData,
                productImages: [productResult.imageData],
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
            // 使用通用处理器批量处理产品图片（>=10MB上传GCS，<10MB转base64）
            const productFiles = formData.getAll("productImages");
            const productResults = await requestHandler.processFilesForModelRequest(
                productFiles, 
                { subFolder: "productImages" }
            );

            const ModelReqParams = {
                productImages: productResults.imageDataArray,
                prompt: formData.get("prompt") as string,
                productDescription: formData.get("productDescription") || "",
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
                taskIdPrefix: taskId,
                uploadBase64ToGcs: true, // 如果返回base64 TryOn结果上传到GCS
                base64SubFolder: 'tryon-generate-results'
            }
        );
        
        // 为兼容性添加filename字段
        resultImages = resultImages.map((item, index) => ({
            ...item,
            filename: item.filename || `tryon-${taskId}-${index + 1}.png`,
        }));
        return NextResponse.json({
            taskId,
            success: true,
            message: 'success',
            resultData: resultImages
        } as TryOnApiResponse, {status: 200})
    } catch (error) {
        return NextResponse.json({
            taskId,
            success: false,
            message: `${error}`,
        } as TryOnApiResponse, {status: 500})
    }
}
