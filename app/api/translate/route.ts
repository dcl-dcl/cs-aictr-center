import { NextRequest, NextResponse } from 'next/server';
import { GenAIGemini } from '@/lib/gcp-clients/gemini';
import { BaseResponse } from '@/types/BaseType';
import { getTaskId } from '@/lib/utils/common-util';


const PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
const GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS;

// 模块级别的客户端实例，复用连接提升性能
const geminiClient = new GenAIGemini(
    PROJECT,
    LOCATION,
    GOOGLE_APPLICATION_CREDENTIALS
);

interface TranslateResponse extends BaseResponse {
    resultData?: {
        translateText: string;
    }
}


export async function POST(
    request: NextRequest
): Promise<NextResponse<TranslateResponse>> {
    const taskId = getTaskId();
    try {
        const { text, targetLanguage } = await request.json();
        console.log("Translate request body: ", { text, targetLanguage })
        // 验证必需参数
        if (!text || !targetLanguage) {
            throw new Error(
                'Missing required parameters: text and targetLanguage',
            )
        }
        const translatePrompt = `
        请将以下文本翻译成${getLanguageName(targetLanguage)}，
        只返回翻译结果，不要添加任何解释或其他内容：\n\n${text}
        `;
        const model = 'gemini-2.5-flash';
        const translateText = await geminiClient.generateTextContent(
            translatePrompt, model,
            {
                temperature: 0.1, // 低温度确保翻译准确性
                maxOutputTokens: 1024,
                topP: 0.8
            }
        );
        console.log("Translate response: ", translateText)
        return NextResponse.json({
            success: true,
            message: '翻译成功',
            resultData: {translateText: translateText},
            taskId: taskId,
        } as TranslateResponse, { status: 200 })
    } catch (error) {
        return NextResponse.json({
            taskId: taskId,
            success: false,
            message: `翻译失败，${error}`,
        } as TranslateResponse, { status: 500 })
    }
}


function getLanguageName(languageCode: string): string {
    const languageMap: { [key: string]: string } = {
        'en': '英语',
        'zh': '中文',
        'zh-CN': '简体中文',
        'zh-TW': '繁体中文',
        'ja': '日语',
        'ko': '韩语',
        'fr': '法语',
        'de': '德语',
        'es': '西班牙语',
        'it': '意大利语',
        'pt': '葡萄牙语',
        'ru': '俄语',
        'ar': '阿拉伯语',
        'hi': '印地语',
        'th': '泰语',
        'vi': '越南语'
    };
    return languageMap[languageCode] || languageCode;
}