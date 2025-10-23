import { NextRequest, NextResponse } from 'next/server';
import { BaseResponse } from '@/types/BaseType';
import { GenAIGemini } from '@/lib/gemini';
import { fileToBase64 } from '@/utils/MediaUtil';
import { getTaskId } from '@/utils/CommonUtil';

const PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
const GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS;

// 模块级别的客户端实例，复用连接提升性能
const geminiClient = new GenAIGemini(PROJECT, LOCATION, GOOGLE_APPLICATION_CREDENTIALS);

const model = 'gemini-2.5-flash';
const imagenPrompt = `Generate a highly detailed text prompt, suitable for a text-to-image model such as Imagen 3, to recreate the uploaded image with maximum accuracy. The prompt should describe these aspects of the image:
1.  **Subject:**  Main objects/figures, appearance, features, species (if applicable), clothing, pose, actions. Be extremely specific (e.g., "a fluffy ginger cat with emerald green eyes sitting on a windowsill" instead of "a cat").
2.  **Composition:** Arrangement of subjects (centered, off-center, foreground, background), perspective/camera angle (close-up, wide shot, bird's-eye view).
3.  **Setting:** Environment, location, time of day, weather. Be specific (e.g., "a dimly lit, ornate library with towering bookshelves" instead of "a library").
4.  **Style:** Artistic style (photorealistic, oil painting, watercolor, cartoon, pixel art, abstract). Mention specific artists if relevant.
5.  **Lighting:** Lighting conditions (bright sunlight, soft indoor lighting, dramatic shadows, backlighting), direction and intensity of light.
6.  **Color Palette:** Dominant colors, overall color scheme (vibrant, muted, monochromatic, warm, cool).
7.  **Texture:** Textures of objects and surfaces (smooth, rough, furry, metallic, glossy).
8.  **Mood/Atmosphere:** Overall feeling or emotion (serene, joyful, mysterious, ominous).

**Output Format:**  I want the prompt to be ONLY a single paragraph of text, directly usable by the text-to-image model.  **Do not add any conversational filler, preambles, or extra sentences like "Text-to-Image Prompt:". Do not format the output as a list or use any special characters like <0xC2><0xA0>.**
**Example Output (Correct Format): "A photorealistic image of a Ragdoll or Birman cat with light cream and beige long fur, sitting upright on a kitchen counter or appliance with its paws tucked beneath it. The cat has bright blue eyes, a small pink nose, and pointed, tufted ears. Its tail is long and fluffy, draping down behind it. The background is slightly blurred and features a dark horizontal band suggesting an appliance, and a glass partition with black metal frames. The lighting is soft and diffused, illuminating the cat evenly. The dominant colors are light cream, beige, white, blue, and black. The overall style is realistic photography with a focus on detail and natural lighting. The image conveys a sense of calmness and gentle curiosity."
**Important:** The prompt must be highly descriptive, prioritizing the most visually important elements for accurate recreation. The prompt can be up to 75 tokens.`

const veoPrompt = `Generate a highly detailed text prompt, suitable for a text-to-video model such as **Veo**, to create a short video clip inspired by the uploaded image, focusing on dynamic action and visual storytelling. The prompt should describe these aspects for the video:
1.  **Subject & Action:** Main objects/figures, their appearance, features, species (if applicable), clothing. Crucially, describe their **movements, actions, interactions, and any changes in expression or pose over the duration of the clip**. Be extremely specific (e.g., "a fluffy ginger cat with emerald green eyes slowly blinking, then stretching its front paws forward on a windowsill" instead of "a cat").
2.  **Scene Composition & Camera Work:** Initial arrangement of subjects (centered, off-center, foreground, background). Specify the **camera angle and shot type (e.g., close-up, wide shot, POV) and describe any camera movement** (e.g., slow pan right, zoom in, tracking shot following the subject, static shot).
3.  **Setting & Environmental Dynamics:** Environment, location, time of day, weather, including any **dynamic environmental elements** (e.g., "leaves blowing in the wind in a sun-dappled forest at golden hour," "rain streaking down a window in a cozy, dimly lit room at night").
4.  **Visual Style:** Artistic style of the video (e.g., photorealistic, cinematic, anime, watercolor animation, gritty found footage, pixel art). Mention specific directors or cinematic styles if relevant.
5.  **Lighting & Atmosphere:** Lighting conditions (bright sunlight, moody twilight, soft indoor lighting, dramatic shadows), its direction, intensity, and **how it might change or interact with the scene's motion**. This contributes to the overall mood (serene, joyful, mysterious, ominous).
6.  **Color Palette:** Dominant colors and overall color scheme of the video (vibrant, desaturated, monochromatic, warm, cool tones), and if they shift.
7.  **Key Textures:** Prominent textures of subjects and the environment relevant to the video's look and feel (smooth, rough, furry, metallic, wet, windswept).
8.  **Video Clip Focus & Pacing:** Briefly suggest the overall pacing (e.g., slow and graceful, fast-paced action, serene and calm) and what key moment, action, or transformation the short video clip should focus on.

**Output Format:** I want the prompt to be ONLY a single paragraph of text, directly usable by the text-to-video model **Veo**. **Do not add any conversational filler, preambles, or extra sentences like "Text-to-Video Prompt:". Do not format the output as a list or use any special characters like  .**
**Example Output (Correct Format): "A cinematic, photorealistic short video clip of a Ragdoll cat with light cream and beige long fur, initially curled up sleeping on a sunlit wooden floor. The cat slowly awakens, stretches its paws out, and yawns widely, its bright blue eyes blinking open. The camera is at a low angle, close-up on the cat, with a very gentle zoom-out as it stretches. Dust motes drift in the warm sunlight streaming from a nearby window, creating a soft, hazy atmosphere. The background shows a slightly out-of-focus cozy living room. The dominant colors are warm wood tones, light cream, and soft blues. The clip should convey a serene and peaceful morning moment."**
**Important:** The prompt must be highly descriptive, prioritizing key visual elements and **essential motion cues** for generating an engaging video clip. The prompt can be up to 75 tokens.`

interface Image2PromptResponse extends BaseResponse {
    resultData?: {
        prompt: string;
    }
}

export async function POST(
    req: NextRequest
): Promise<NextResponse<Image2PromptResponse>>{
    const taskId = getTaskId();
    try {
        const formData = await req.formData();
        const image = formData.get('image') as File;
        const target = formData.get('target') as string;
        if (!image) {
            throw new Error('请上传图片')
        }

        let prompt = '';
        if (target === 'veo') {
            prompt = veoPrompt;
        } else if (target === 'image') {
            prompt = imagenPrompt;
        } else {
            throw new Error(`暂不支持图片生成${target}提示词`)
        }
        console.log("PROJECT:", PROJECT, "LOCATION:", LOCATION)
        const response = await geminiClient.generateContent(
            prompt, model, [{
                mimeType: image.type,
                data: await fileToBase64(image),
            }]
        );
        const resultPrompt = await geminiClient.parseTextStream(response);
        return NextResponse.json({
            taskId,
            success: true,
            message: `图片生成${target}提示词成功`,
            resultData: {
                prompt: resultPrompt,
            }
        }, { status: 200 })

    } catch (error) {
        return NextResponse.json({
            taskId,
            success: false,
            message: `${error}`,
        } as Image2PromptResponse, { status: 500 })
    }


}