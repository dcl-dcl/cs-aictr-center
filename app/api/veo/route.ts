import { NextRequest, NextResponse } from 'next/server';
import { transformParameters, getTaskId } from '@/utils/CommonUtil';
import { VeoApiResponse } from '@/types/VeoType';
import { fileToBase64 } from '@/utils/MediaUtil';
import { GCS } from '@/lib/gcs';
import { Veo, VeoGenerateParameters, imageData} from '@/lib/veo';


const PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
const GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const GCS_BUCKET = process.env.GOOGLE_CLOUD_GCS_BUCKET;

// 模块级别的客户端实例，复用连接提升性能
const veoClient = new Veo(
    PROJECT, LOCATION, GCS_BUCKET + "/veo",
    GOOGLE_APPLICATION_CREDENTIALS
);


export async function POST(
    request: NextRequest
): Promise<NextResponse<VeoApiResponse>> {
    const taskId = getTaskId();
    try {
        //参数准备
        const formData: any = await request.formData();
        console.log("VEO POST 请求参数：", formData);
        const modelName = formData.get("modelName") as string;
        //参考图片
        let image: imageData = {
            mimeType: "image/jpeg",
        }
        if (formData.get("inputImage")) {
            const inputImage = formData.get("inputImage");
            image.bytesBase64Encoded = await fileToBase64(inputImage);
            image.mimeType = inputImage.type;
        } else if (formData.get("urlImage")) {
            const urlImage = JSON.parse(formData.get("urlImage") || "{}");
            image.mimeType = urlImage.mimeType;
            if (urlImage.gcsUri) {
                image.gcsUri = urlImage.gcsUri;
            } else if (urlImage.url && urlImage.url.includes("base64,")) {
                image.bytesBase64Encoded = urlImage.url.split("base64,")[1];
            } else {
                throw new Error("VEO参考图仅支持传入File文件或GCS Uri或Base64 Url")
            }
        } else {
            image = undefined;
        }
        //尾帧图片
        let lastFrame: imageData = {
            mimeType: "image/jpeg",
        }
        if (formData.get("lastFrame")) {
            const image = formData.get("lastFrame");
            lastFrame.bytesBase64Encoded = await fileToBase64(image);
            lastFrame.mimeType = image.type;
        }
        //设置参数
        let parameters: any = {};
        try {
            parameters = JSON.parse(formData.get("ConfigParameters") || "{}")
        } catch (error) {
            throw new Error(`参数转换失败:${error}`)
        }
        parameters = transformParameters<VeoGenerateParameters>(parameters)
        console.log("send generate video task, prompt:", formData.get("prompt"),
            "parameters:", parameters)
        // console.log("image:", image, "lastFrame:", lastFrame)

        const operationName = await veoClient.generateVideo(
            modelName, formData.get("prompt"), image, lastFrame, parameters
        )
        return NextResponse.json({
            taskId,
            success: true,
            message: 'send generate video task success',
            operationName: operationName,
        } as VeoApiResponse, {status: 200})
    } catch (error) {
        return NextResponse.json({
            taskId,
            success: false,
            message: `${error}`,
        } as VeoApiResponse, {status: 500})
    }
}


export async function GET(
    request: NextRequest
): Promise<NextResponse<VeoApiResponse>>{
    const taskId = getTaskId();
    try {
        console.log("VEO GET 请求参数：", request.url)
        const url = new URL(request.url);
        const operationName = url.searchParams.get('operationName');
        const modelName = url.searchParams.get('modelName');
        console.log("operationName:", operationName, "modelName:", modelName)
        // 验证必需参数
        if (!operationName || !modelName) {
            return NextResponse.json({
                taskId,
                success: false,
                message: '缺少必需参数: operationName 和 modelName',
            } as VeoApiResponse, {status: 400})
        }

        // 检查任务状态
        const taskResult = await veoClient.waitForOperationWithoutPolling(operationName, modelName);
        let resultVideos: VeoApiResponse["resultData"] = [];
        let message: string = "视频已生成"
        if (taskResult?.error) {
            throw new Error(`${taskResult.error.code} ${taskResult.error.message}` || "未知错误，模型生成视频失败")
        } else if (!taskResult.done) {
            message = "视频任务正在进行中"
            return NextResponse.json({
                taskId,
                success: true,
                message: message,
                done: false,
                resultData: []
            } as VeoApiResponse, {status: 200})
        } else {
            if (taskResult.response?.videos.length <= 0) { 
                throw new Error("未知错误，模型生成视频失败，视频列表为空")
            }
            // 处理视频结果，转换GCS URI为签名URL
            const gcsClient = new GCS(GOOGLE_APPLICATION_CREDENTIALS);
            resultVideos = await Promise.all(
                taskResult.response.videos.map(async (video, index) => {
                    return {
                        ...video,
                        url: await gcsClient.gcsUriToSignedUrl(video.gcsUri),
                        id: `${taskId}-${index}`,
                        filename: `veo-${taskId}-${index + 1}.mp4`,
                    }
                })
            );
        }
        return NextResponse.json({
            taskId,
            success: true,
            message: message,
            done: taskResult.done,
            resultData: resultVideos
        } as VeoApiResponse, {status: 200})
    } catch (error) {
        return NextResponse.json({
            taskId,
            success: false,
            message: `${error}`,
        } as VeoApiResponse, {status: 500})
    }
}
