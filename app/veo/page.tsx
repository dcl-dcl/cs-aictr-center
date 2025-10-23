'use client'
import { useState, useEffect } from 'react';
import { LoadingSpinner, VideoGenerateResultIcon } from '@/components/CommonUI';
import { ModelSelect, initializeConfigSelections } from '@/components/Selector';
import {
    // ImagePreview, RemoveFiles, createImageUploadHandler,
    VideoPreview, downloadSingleFile, downloadAllFiles, MediaType,
 } from '@/components/MediaPreview';
import { ConfigurationPanel } from '@/components/ConfigurationPanel';
import ErrorModal from '@/components/ErrorModal';
import { MediaFile } from '@/types/BaseType';
import { 
    VeoModelOptions, getVeoConfigParameters, SupportImageToVideoModelList,
    SupportFrameImageModelList,
} from '@/constants/VeoData';
import PageLayout from '@/components/PageLayout';
import { ImageUpload } from '@/components/ImageUpload';


export default function VeoPage() {
    const [prompt, setPrompt] = useState('');
    const [selectedModel, setSelectedModel] = useState(VeoModelOptions[0].value);
    const [configSelections, setConfigSelections] = useState<Record<string, any>>(
        initializeConfigSelections(getVeoConfigParameters(VeoModelOptions[0].value))
    );
    const [inputImage, setInputImage] = useState<File | null>(null);
    const [urlImage, setUrlImage] = useState<MediaFile | null>(null);
    const [lastFrameImage, setLastFrameImage] = useState<File | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedVideos, setGeneratedVideos] = useState<Array<MediaFile>>([]);
    const [error, setError] = useState<string | null>(null);
    const [showError, setShowError] = useState(false);

    // 检查是否有从Imagen页面传递过来的图片
    useEffect(() => {
        const selectedImageData = sessionStorage.getItem('selectedImageForVideo');
        if (selectedImageData) {
            try {
                handleModelChange(SupportImageToVideoModelList[0])
                const imageData = JSON.parse(selectedImageData);
                // 直接使用URL创建MediaFile对象，避免跨域问题
                const imageUrl = imageData.url;
                if (imageUrl) {
                    const urlImage: MediaFile = {
                        id: 'selected-image',
                        url: imageUrl,
                        gcsUri: imageData.gcsUri,
                        filename: imageData.name || 'selected_image.png',
                        mimeType: imageData.type || 'image/png'
                    };
                    setUrlImage(urlImage);
                }
                
                // 清除sessionStorage中的数据
                sessionStorage.removeItem('selectedImageForVideo');
            } catch (error) {
                console.error('解析图片数据失败:', error);
                sessionStorage.removeItem('selectedImageForVideo');
            }
        }
    }, []);

    const handleModelChange = (newModel: string) => {
        setSelectedModel(newModel);
        setConfigSelections(initializeConfigSelections(getVeoConfigParameters(newModel)));
    };

    const handleReset = () => {
        setPrompt('');
        setInputImage(null);
        setUrlImage(null);
        setLastFrameImage(null);
        setGeneratedVideos([]);
        setConfigSelections(initializeConfigSelections(getVeoConfigParameters(selectedModel)));
    }

    // 轮询任务状态的函数
    const pollTaskStatus = async (operationName: string, modelName: string, maxAttempts = 60) => {
        let attempts = 0;
        let timeoutId: NodeJS.Timeout | null = null;

        const clearCurrentTimeout = () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
        };

        return new Promise((resolve, reject) => {
            const poll = async () => {
                attempts++;
                try {
                    console.log(`开始第 ${attempts} 次轮询...`);
                    const response = await fetch(
                        `/api/veo?operationName=${encodeURIComponent(operationName)}&modelName=${encodeURIComponent(modelName)}`,
                        { method: 'GET' }
                    );
                    const result = await response.json();
                    if (!result.success) {
                        clearCurrentTimeout();
                        attempts = maxAttempts + 1;
                        throw new Error(result?.message || 'API 调用失败或返回数据格式错误');
                    }
                    
                    if (result.done && result?.resultData.length > 0) {
                        // 任务完成且有结果
                        clearCurrentTimeout();
                        resolve(result.resultData);
                        return;
                    } else if (attempts >= maxAttempts) {
                        // 达到最大尝试次数
                        clearCurrentTimeout();
                        reject(new Error("超过最大轮询次数，任务可能仍在进行中"));
                        return;
                    } else {
                        // 任务仍在进行中，继续轮询
                        console.log(`任务进行中，第 ${attempts} 次轮询完成，5秒后继续...`);
                        clearCurrentTimeout(); // 清除之前的定时器
                        timeoutId = setTimeout(poll, 5000);
                    }
                } catch (error) {
                    if (attempts >= maxAttempts) {
                        clearCurrentTimeout();
                        reject(error);
                        return;
                    }
                    // 发生错误，等待后重试
                    console.log(`发生错误: ${error}, 5秒后重试...`);
                    clearCurrentTimeout(); // 清除之前的定时器
                    timeoutId = setTimeout(poll, 5000);
                }
            };
            poll();
        });
    };

    const handleGenerate = async () => {
        // 清除之前的错误
        setError(null);
        setShowError(false);
        
        // 参数校验
        if (!prompt.trim()) {
            setError('请输入视频描述提示词');
            setShowError(true);
            return;
        }
        if (!SupportImageToVideoModelList.includes(selectedModel) && (inputImage || urlImage)) {
            setError(`当前模型不支持图生视频，请选择${SupportImageToVideoModelList.join(',')}中任一模型`);
            setShowError(true);
            return;
        }
        if (!SupportFrameImageModelList.includes(selectedModel) && (lastFrameImage)) {
            setError(`当前模型不支持首尾帧图片，请选择${SupportFrameImageModelList.join(',')}中任一模型`);
            setShowError(true);
            return;
        }
        // 准备参数
        const formData = new FormData();
        formData.append('modelName', selectedModel);
        formData.append('prompt', prompt);
        formData.append('ConfigParameters', JSON.stringify(configSelections));
        // 处理图片输入
        if (urlImage) {
            // 如果有从Imagen页面传递的图片，优先使用
            formData.append('urlImage', JSON.stringify(urlImage))
        } else if (inputImage) {
            // 如果没有从Imagen页面传递的图片，但有用户上传的图片，使用File对象
            formData.append('inputImage', inputImage);
        }
        if (lastFrameImage) {
            formData.append('lastFrame', lastFrameImage);
        }
        
        setIsGenerating(true);
        try {
            // 第一步：发送POST请求创建生成任务
            const response = await fetch('/api/veo', {
                method: 'POST',
                body: formData,
            });
            const taskResult = await response.json();
            if (!taskResult.success || !taskResult?.operationName) {
                throw new Error(taskResult?.message || 'API 调用失败或返回数据格式错误');
            }
            const operationName = taskResult.operationName;
            console.log('任务创建成功，operationName:', operationName);
            // 第二步：轮询任务状态
            const resultVideos = await pollTaskStatus(
                operationName, selectedModel
            ) as MediaFile[];
            console.log("resultVideos", resultVideos)
            // 第三步：更新状态
            setGeneratedVideos(resultVideos.map((video, index: number) => ({
                id: video.id || `${index}`,
                url: video.url || "#",
                filename: video?.filename || `veo-${taskResult.taskId}-${index + 1}.mp4`,
                mimeType: video?.mimeType || 'video/mp4',
                aspectRatio: video.aspectRatio || configSelections.aspectRatio,
            })));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            setError(`生成视频失败：${errorMessage}`);
            setShowError(true);
        } finally {
            setIsGenerating(false);
        }
    };

    // 组件卸载时清理资源
    useEffect(() => {
        return () => {
            // 清理生成的视频 URL
            generatedVideos.forEach(video => {
                if (video.url && video.url !== '#') {
                    URL.revokeObjectURL(video.url);
                }
            });
        };
    }, [generatedVideos]);

    // 左侧内容
    const leftContent = (
        <>
                        {/* 标题和模型选择 */}
                        <ModelSelect
                            title="生成模型"
                            options={VeoModelOptions}
                            value={selectedModel}
                            onChange={handleModelChange}
                        />

                        {/* 提示词区域 */}
                        <div className="mb-2">
                            <div className="flex items-center mb-4">
                                <span className="text-orange-500 mr-2">●</span>
                                <h2 className="text-xl font-semibold text-gray-800">提示词输入</h2>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <textarea
                                        className="w-full h-36 p-4 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 
                                        focus:border-blue-500 bg-white resize-none placeholder-gray-500 text-black text-m leading-relaxed"
                                        placeholder="请详细描述您想要生成的视频内容..."
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 图片上传区域 */}
                        <div className="mb-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* 参考图片上传 */}
                                <ImageUpload
                                    imageUrl={
                                        inputImage
                                            ? URL.createObjectURL(inputImage)
                                            : urlImage
                                            ? urlImage.url
                                            : undefined
                                    }
                                    onImageChange={(file) => {
                                        if (file) {
                                            setInputImage(file);
                                            setUrlImage(null);
                                        } else {
                                            setInputImage(null);
                                            setUrlImage(null);
                                        }
                                    }}
                                    title="参考图片"
                                />
                                {/* 尾帧图片上传 */}
                                <ImageUpload
                                    imageUrl={lastFrameImage ? URL.createObjectURL(lastFrameImage) : undefined}
                                    onImageChange={(file) => {
                                        if (file) {
                                            setLastFrameImage(file);
                                        } else {
                                            setLastFrameImage(null);
                                        }
                                    }}
                                    title="尾帧图片"
                                />
                            </div>
                        </div>

                        {/* 工具栏 */}
                        <div className="mb-8">
                            <div className="flex items-center justify-end space-x-4">
                                {/* 重置按钮 */}
                                <button 
                                    className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 relative group transition-colors border border-gray-200 flex items-center gap-2 justify-center"
                                    onClick={handleReset}
                                    title="重置"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span className="text-sm font-medium">重置</span>
                                </button>
                                
                                {/* 生成按钮 */}
                                <button
                                    onClick={handleGenerate}
                                    disabled={isGenerating}
                                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-200 font-medium shadow-sm hover:shadow-md justify-center"
                                >
                                    {isGenerating ? (
                                        <>
                                            <LoadingSpinner />
                                            <span className="text-sm font-medium">生成中...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            <span className="text-sm font-medium">生成视频</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* 设置区域 */}
                        {(Object.keys(configSelections).length > 0) && (
                            <ConfigurationPanel
                                title="设置"
                                titleColor="text-purple-500"
                                configSelections={configSelections}
                                configs={getVeoConfigParameters(selectedModel)}
                                onConfigChange={(configId, value) => {
                                    setConfigSelections(prev => ({
                                        ...prev,
                                        [configId]: value
                                    }));
                            }}
                        />         
                        )}   
        </>
    );

    // 右侧内容
    const rightContent = (
        <>
                    <div className="flex items-center mb-8">
                        <span className="text-green-500 mr-2">●</span>
                        <span className="text-xl font-semibold text-gray-800">生成结果</span>
                    </div>
                    
                    {generatedVideos.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-3/5 text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                            <VideoGenerateResultIcon/>
                        </div>
                    ) : (
                        <VideoPreview
                            urlVideos={generatedVideos}
                            title=""
                            gridCols="grid-cols-1 sm:grid-cols-2"
                            videoHeight="h-80"
                            showDownload={true}
                            showBatchDownload={generatedVideos.length > 1}
                            onDownload={(index, data) => {
                                if (data && typeof data === 'object' && 'url' in data) {
                                    downloadSingleFile(data as MediaFile, MediaType.VIDEO);
                                }
                            }}
                            onBatchDownload={() => {
                                downloadAllFiles(generatedVideos, MediaType.VIDEO);
                            }}
                        />
                    )}
        </>
    );

    return (
        <>
            <PageLayout
                leftContent={leftContent}
                rightContent={rightContent}
            />
        
        {/* 错误提示弹窗 */}
        <ErrorModal
            isOpen={showError}
            error={error}
            onClose={() => {
                setShowError(false);
                setError(null);
            }}
            title="错误提示"
        />
        </>
    );


}