'use client'
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { apiFetch } from '@/lib/utils/api-client';
import { useSearchParams } from 'next/navigation';
import { LoadingSpinner, ImageGenerateResultIcon } from '@/components/CommonUI';
import { MediaFile } from '@/types/BaseType'
import { ModelSelect, initializeConfigSelections } from '@/components/Selector';
import { ConfigurationPanel } from '@/components/ConfigurationPanel';
import { StyleAttributesSelector } from '@/components/StylePromptAttributes';
import {
    ImagePreview, RemoveFiles, 
    downloadSingleFile, downloadAllFiles,
    createImageUploadHandler,
} from '@/components/MediaPreview';
import ImageToPrompt from '@/components/ImageToPrompt';
import ErrorModal from '@/components/ErrorModal';
import PageLayout from '@/components/PageLayout';
// 动态导入历史记录组件，避免首次渲染阻塞，并使用骨架屏
const TaskHistory = dynamic(() => import('@/components/TaskHistory'), {
  ssr: false,
  loading: () => (
    <div className="space-y-4">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
          <div className="flex items-center gap-4">
            <div className="h-3 bg-gray-200 rounded w-24"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
            <div className="h-3 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
      ))}
    </div>
  )
});
import { 
    ImagenModelOptions, GeminiModelOptions,
    getImagenModelConfigs, ImageStyleAttributeData, NanoBananaConfigs,
} from '@/constants/ImagenData';
import { AttributeGroup } from '@/types/BaseType';
import { GenerateStylePrompt } from '@/lib/utils/prompt-util';


const GeminiGenerationTab = 'gemini-generation';
const ImagenGenerationTab = 'imagen-generation';


const getModelOptions = (activeTab: string) => {
    if (activeTab === ImagenGenerationTab) {
        return ImagenModelOptions
    } else {
        return GeminiModelOptions
    }
};

const getModelConfigs = (activeTab: string, modelName: string) => {
    if (activeTab === ImagenGenerationTab) {
        return getImagenModelConfigs(modelName);
    } else {
        return NanoBananaConfigs;
    }
};

export default function ImagenPage () {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>(searchParams.get('tab') || GeminiGenerationTab);
  const [modelOptions, setModelOptions] = useState<typeof ImagenModelOptions | typeof GeminiModelOptions>(
      getModelOptions(activeTab)
  )
  const [selectedModel, setSelectedModel] = useState<string>(modelOptions[0].value)
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [translatedPrompt, setTranslatedPrompt] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [inputImages, setInputImages] = useState<File[]>([]);
  const [generatedImages, setGeneratedImages] = useState<Array<MediaFile>>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [configSelections, setConfigSelections] = useState<{ [key: string]: any }>(
      initializeConfigSelections(getModelConfigs(activeTab, selectedModel))
  );
  const [isImageToPromptOpen, setIsImageToPromptOpen] = useState(false);
  const [selectedStyleAttributes, setSelectedStyleAttributes] = useState<Record<string, string | string[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);

    const handleModelChange = (newModelName: string) => {
        setSelectedModel(newModelName);
        // 当模型改变时，重置参数选择为新模型的默认值
        const currentConfigs = getModelConfigs(activeTab, newModelName);
        const initialSelections = initializeConfigSelections(currentConfigs);
        setConfigSelections(initialSelections);
    };

    const handleReset = () => {
        const currentConfigs = getModelConfigs(activeTab, selectedModel);
        setConfigSelections(initializeConfigSelections(currentConfigs));
        setSelectedStyleAttributes({});
        setGeneratedImages([]);
        setInputImages([]);
        setOriginalPrompt('');
        setTranslatedPrompt('');
    };

    // 监听URL参数变化，同步activeTab状态
    useEffect(() => {
        const currentTab = searchParams.get('tab') || GeminiGenerationTab;
        setActiveTab(currentTab);
    }, [searchParams]);

    // 当activeTab变化时更新相关状态
    useEffect(() => {
        setModelOptions(getModelOptions(activeTab));
        setSelectedModel(getModelOptions(activeTab)[0].value);
        setConfigSelections(initializeConfigSelections(getModelConfigs(activeTab, getModelOptions(activeTab)[0].value)));
        setOriginalPrompt('');
        setTranslatedPrompt('');
        setGeneratedImages([]);
        setInputImages([]);
        setIsGenerating(false);
        setError(null);
        setShowError(false);
    }, [activeTab]);

    // 应用生成的提示词
    const handleApplyPrompt = (prompt: string) => {
        setOriginalPrompt(prompt);
        setTranslatedPrompt('');
    };

    const handleTranslate = async () => {
        // 清除之前的错误
        setError(null);
        setShowError(false);
        // 参数校验
        if (!originalPrompt.trim()) {
            setError('请输入提示词');
            setShowError(true);
            return;
        }
        
        setIsTranslating(true);
        
        try {
            const response = await apiFetch('/api/translate', {
                method: 'POST',
                data: {
                    text: originalPrompt,
                    targetLanguage: 'en',
                },
            });
            
            const result = await response.json();
            if (!result.success || !result?.resultData) {
                throw new Error(result?.message || '翻译失败，请重试');
            }
            
            setTranslatedPrompt(result.resultData.translateText);
        } catch (error) {
            console.error('翻译错误:', error);
            const errorMessage = error instanceof Error ? error?.message : '未知错误';
            setError(`翻译失败：${errorMessage}`);
            setShowError(true);
        } finally {
            setIsTranslating(false);
        }
    }

    const handleGenerate = async () => {
        // 清除之前的错误
        setError(null);
        setShowError(false);
        //校验参数
        let promptToUse = translatedPrompt || originalPrompt
        if (promptToUse === '') {
            setError('请输入提示词');
            setShowError(true);
            return;
        }
        if (selectedStyleAttributes) {
            // 将string[]类型的值转换为string类型
            const stringAttributes: Record<string, string> = {};
            Object.entries(selectedStyleAttributes).forEach(([key, value]) => {
                stringAttributes[key] = Array.isArray(value) ? value.join(', ') : value;
            });
            promptToUse = GenerateStylePrompt(stringAttributes, promptToUse, 'image')
        }
        setIsGenerating(true);
        //准备参数
        const formData = new FormData();
        formData.append('modelName', selectedModel);
        formData.append('prompt', promptToUse);
        formData.append('taskFromTab', `imagen?tab=${activeTab}`);

        // 添加配置参数
        if (configSelections) {
            formData.append('configParameters', JSON.stringify(configSelections));
        }

        if (inputImages.length > 0) {
            inputImages.forEach((file, index) => {
                formData.append('inputImages', file);
            });
        }

        //调用api生成图片
        try {
            const response = await apiFetch('/api/imagen', {
                method: 'POST',
                data: formData,
            });
            
            const result = await response.json();
            if (!result.success || !result?.resultData) {
                throw new Error(result?.message || '生成失败，请重试')
            }
            setGeneratedImages(result.resultData);

    } catch (error) {
      console.error('生成图片错误:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setError(`生成图片失败：${errorMessage}`);
      setShowError(true);
    } finally {
      setIsGenerating(false);
      // 无论成功或失败都刷新历史记录以展示最新任务状态
      setHistoryRefreshKey((k) => k + 1);
    }
  };

    // 处理生成视频
    const useImageGenerateVideo = (index: number, imageData: any) => {
        try {
            // 获取选中的图片数据
            const selectedImage = generatedImages[index];
            if (!selectedImage) {
                setError('选中的图片不存在');
                setShowError(true);
                return;
            }

            // 将图片数据存储到sessionStorage
            const imageForVideo = {
                name: selectedImage.filename || `generated_image_${index}.png`,
                type: 'image/png',
                url: selectedImage.url,
                gcsUri: selectedImage.gcsUri,
                data: selectedImage
            };

            sessionStorage.setItem('selectedImageForVideo', JSON.stringify(imageForVideo));
            
            // 在新标签页中打开视频生成页面
            window.open('/veo', '_blank');
        } catch (error) {
            console.error('处理生成视频错误:', error);
            setError('跳转到视频生成页面失败');
            setShowError(true);
        }
    };

    // 左侧内容
    const leftContent = (
        <>
                    {/* 标题和模型选择 */}
                    <ModelSelect
                        title="生图模型"
                        options={modelOptions}
                        value={selectedModel}
                        onChange={handleModelChange}
                    />

                    {/* 提示词区域 */}
                    <div className="mb-6">
                        <div className="flex items-center mb-4">
                            <span className="text-orange-500 mr-2">●</span>
                            <h2 className="text-xl font-semibold text-gray-800">提示词输入</h2>
                            </div>
                        <div className="space-y-3">
                            <div>
                                <textarea
                                    className="w-full h-36 p-4 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 
                                    focus:border-blue-500 bg-white resize-none placeholder-gray-500 text-black text-m leading-relaxed"
                                    placeholder="请输入您想要生成的图像描述..."
                                    value={originalPrompt}
                                    onChange={(e) => setOriginalPrompt(e.target.value)} 
                                    // disabled={isGenerating}
                                />
                            </div>
                            
                            {/* 显示翻译后的提示词 */}
                            {translatedPrompt && (
                                <div>
                                    <label className="block text-l text-gray-700 mb-1">英文翻译</label>
                                    <textarea
                                        className="w-full h-36 p-4 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 
                                    focus:border-blue-500 bg-white resize-none placeholder-gray-500 text-black text-m leading-relaxed"
                                        value={translatedPrompt}
                                        onChange={(e) => setTranslatedPrompt(e.target.value)}
                                        disabled={isGenerating}
                                    />
                                </div>
                            )}
                            
                            {/* 显示已上传的图片 */}
                            {inputImages.length > 0 && (
                            <div>
                                <label className="block text-l text-gray-700 mb-1">已上传图片</label>
                                <ImagePreview
                                files={inputImages}
                                showRemove={true}
                                onRemove={(index: number) => RemoveFiles(setInputImages, index)}
                                title=''
                                gridCols="grid-cols-2 md:grid-cols-8"
                                buttonSize="w-5 h-5"
                                className="mt-4 border-2 border-gray-300 rounded-lg p-4"
                            />
                            </div>

                            )}    
                                    
                        </div>
                              
                    </div>
                        
                    {/* 工具栏 */}
                    <div className="flex flex-wrap items-center justify-end gap-3 mb-6">
                                
                        {/* 图片上传按钮 activeTab===Gemini时出现 */}
                        {activeTab === GeminiGenerationTab && (
                            <label className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer relative group transition-colors border border-gray-200 flex items-center gap-2 min-w-[100px] sm:min-w-[120px] h-[40px] justify-center flex-shrink-0">
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={createImageUploadHandler(
                                        setInputImages, {maxCount: 10, replace: false}
                                    )}
                                />
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm">上传参考图</span>
                            </label>)}
                        
                        {/* 上传图片生成提示词 */}
                        <button 
                            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer relative group transition-colors border border-gray-200 flex items-center gap-2 min-w-[100px] sm:min-w-[120px] h-[40px] justify-center flex-shrink-0"
                            onClick={() => setIsImageToPromptOpen(true)}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            <span className="text-sm">图生提示词</span>
                        </button>        
                        

                        {/* 翻译按钮 */}
                        <button 
                            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 relative group transition-colors border border-gray-200 flex items-center gap-2 min-w-[100px] sm:min-w-[120px] h-[40px] justify-center flex-shrink-0"
                            onClick={handleTranslate}
                            disabled={isTranslating}
                            title="翻译提示词"
                        >
                            {isTranslating ? (
                                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                                </svg>
                            )}
                            <span className="text-sm">{isTranslating ? '翻译中...' : '翻译提示词'}</span>
                        </button>
                        

                        
                        {/* 重置按钮 */}
                        <button 
                            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 relative group transition-colors border border-gray-200 flex items-center gap-2 min-w-[100px] sm:min-w-[120px] h-[40px] justify-center flex-shrink-0"
                            onClick={() => handleReset()}
                            title="重置"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span className="text-sm">重置</span>
                        </button>
                        
                        {/* 生成按钮 */}
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-200 font-medium shadow-sm hover:shadow-md min-w-[100px] sm:min-w-[120px] h-[40px] justify-center flex-shrink-0"
                        >
                            {isGenerating ? (
                                <>
                                    <LoadingSpinner />
                                    <span className="text-sm">生成中...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    <span className="text-sm">生成图像</span>
                                </>
                            )}
                        </button>
                    </div>


                    {/* 参数设置区域 */}
                    {(Object.keys(configSelections).length > 0) && (
                        <div className="mb-6">
                            <ConfigurationPanel
                                title="设置"
                                titleColor="text-purple-500"
                                configSelections={configSelections}
                                configs={getModelConfigs(activeTab, selectedModel)}
                                // itemsPerRow={activeTab === ImagenGenerationTab? 2 : 1}
                                onConfigChange={(configId, value) => {
                                    setConfigSelections(prev => ({
                                        ...prev,
                                        [configId]: value
                                    }));
                                }}
                            />         
                        </div>
                    )}   
                    
                    {/* 图像提示词属性 */}
                    <div className="mb-6">
                        <StyleAttributesSelector
                            title="图像提示属性"
                            titleColor="text-blue-500"
                            attributeGroups={ImageStyleAttributeData as AttributeGroup[]}
                            selectedAttributes={selectedStyleAttributes}
                            onAttributeChange={(groupId, value) => {
                                setSelectedStyleAttributes(prev => ({
                                    ...prev,
                                    [groupId]: value
                                }));
                            }}
                        />
                    </div>
        </>
    );

    // 中间内容 - 生成结果
    const centerContent = (
        <>
                    <div className="flex items-center mb-6">
                        <span className="text-green-500 mr-2">●</span>
                        <span className="text-xl font-semibold text-gray-800">生成结果</span>
                    </div>
                    
                    {generatedImages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 lg:h-3/5 text-gray-400 bg-white rounded-xl border-2 border-dashed border-gray-200">
                            <ImageGenerateResultIcon
                                primaryText="生成的图像将在这里显示"
                                secondaryText="请输入提示词，然后点击生成按钮开始创作"
                            />
                        </div>
                    ) : (
                    <>
                        <ImagePreview
                            urlImages={generatedImages}
                            showRemove={false}
                            showDownload={true}
                            showBatchDownload={false}
                            showGenerateVideo={true}
                            onDownload={(index, data) => downloadSingleFile(data as MediaFile)}
                            onBatchDownload={() => downloadAllFiles(generatedImages)}
                            // onGenerateVideo={useImageGenerateVideo}
                            title=''
                            imageHeight='h-64'     
                            gridCols="grid-cols-1 sm:grid-cols-2"
                            buttonSize="w-5 h-5"
                            className=""
                        />                
                    </>
                               
                    )}
        </>
    );

    // 右侧内容 - 历史记录
    const rightContent = (
        <>
            <div className="flex items-center mb-6">
                <span className="text-blue-500 mr-2">●</span>
                <span className="text-xl font-semibold text-gray-800">历史记录</span>
            </div>
            <TaskHistory
                path="imagen"
                tab={activeTab}
                page={1}
                page_size={10}
                className=""
                refreshSignal={historyRefreshKey}
            />
        </>
    );

    return (
        <>
            <PageLayout
                leftContent={leftContent}
                centerContent={centerContent}
                rightContent={rightContent}
                containerClassName="h-full bg-gradient-to-br from-gray-50 to-gray-100"
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
            
            {/* 图生提示词弹窗 */}
            <ImageToPrompt
                isOpen={isImageToPromptOpen}
                onClose={() => setIsImageToPromptOpen(false)}
                onApplyPrompt={handleApplyPrompt}
            />
        </>
    )
}