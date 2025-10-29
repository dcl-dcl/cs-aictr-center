'use client'
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/utils/api-client';
import { useSearchParams } from 'next/navigation';
import { LoadingSpinner, ImageGenerateResultIcon, UploadIcon } from '@/components/CommonUI';
import { ModelSelect, initializeConfigSelections } from '@/components/Selector';
import {
    ImagePreview, RemoveFiles, downloadSingleFile, downloadAllFiles,
    createImageUploadHandler,
 } from '@/components/MediaPreview';
import { ConfigurationPanel } from '@/components/ConfigurationPanel';
import ErrorModal from '@/components/ErrorModal';
import PageLayout from '@/components/PageLayout';
import TaskHistory from '@/components/TaskHistory';
import { MediaFile } from '@/types/BaseType';
import { 
    TryOnConfigs, ProductRecontextConfigs, 
    TryonModelOptions, ProductRecontextModelOptions,
} from '@/constants/TryonData';

const TryOnTab = 'tryon';
const ProductRecontextTab = 'product-recontext';


const getCurrentConfigs = (activeTab: string) => {
    if (activeTab === TryOnTab) {
        return TryOnConfigs
    } else {
        return ProductRecontextConfigs
    }
};

export default function TryOnPage() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || TryOnTab;
  const [prompt, setPrompt] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [modelImages, setModelImages] = useState<File[]>([]);
  const [productImages, setProductImages] = useState<File[]>([]);
  const [generatedImages, setGeneratedImages] = useState<Array<MediaFile>>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [configSelections, setConfigSelections] = useState<Record<string, string>>(
      initializeConfigSelections(getCurrentConfigs(activeTab))
  );
  const [error, setError] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);

    // 当activeTab变化时清空数据
    useEffect(() => {
        setPrompt('');
        setProductDescription('');
        setModelImages([]);
        setProductImages([]);
        setIsGenerating(false);
        setGeneratedImages([]);
        setError(null);
        setShowError(false);
        // 重置参数选择为当前tab的默认值
        const currentConfigs = getCurrentConfigs(activeTab)
        setConfigSelections(initializeConfigSelections(currentConfigs))
    }, [activeTab]);

    const handleGenerate = async () => {
        // 清除之前的错误
        setError(null);
        setShowError(false);
        
        // 参数校验
        if (productImages.length === 0) {
            setError('请上传产品图片');
            setShowError(true);
            return;
        }
        if (modelImages.length === 0 && activeTab === TryOnTab) {
            setError('请上传模特图片');
            setShowError(true);
            return;
        }
        if (activeTab === ProductRecontextTab && !prompt.trim()) {
            setError('请输入提示词');
            setShowError(true);
            return;
        }
        
        // 准备参数
        const formData = new FormData();
        formData.append('modelName', (
            activeTab === TryOnTab ? TryonModelOptions[0].value
                : ProductRecontextModelOptions[0].value
        ));
        productImages.forEach((file, index) => {
            formData.append('productImages', file);
        });
        if (activeTab === TryOnTab) {
            modelImages.forEach((file, index) => {
            formData.append('personImages', file);
            });
        }
        if (prompt) formData.append('prompt', prompt);
        if (productDescription) formData.append('productDescription', productDescription);
        formData.append('ConfigParameters', JSON.stringify(configSelections));
        formData.append('taskFromTab', `tryon?tab=${activeTab}`);

        setIsGenerating(true);
        try {
            const response = await apiFetch('/api/tryon', {
                method: 'POST',
                data: formData,
            });
            
            const result = await response.json();
            if (!result.success || !result?.resultData) {
                throw new Error(result?.message || '生成失败，请重试');
            }
            setGeneratedImages(result.resultData);

    } catch (error) {
      console.error('生成试穿效果错误:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setError(`生成试穿效果失败：${errorMessage}`);
      setShowError(true);
    } finally {
      setIsGenerating(false);
      // 无论成功或失败都刷新历史记录以展示最新任务状态
      setHistoryRefreshKey((k) => k + 1);
    }
  };

    const SampleImageDisplay = ({ label, imgSrc, size = 'md' }: { label: string, imgSrc: string, size?: 'sm' | 'md' | 'lg' }) => {
        const sizeClasses = size === 'sm' ? 'w-36 h-48 p-3' : size === 'lg' ? 'w-56 h-72 p-5' : 'w-48 h-64 p-4';
        const labelSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm';
        return (
            <div className="text-center flex-shrink-0">
                <div className={`${sizeClasses} bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center mb-3 hover:border-gray-400 hover:shadow-md transition-all duration-200 overflow-hidden`}>
                    <img
                        src={imgSrc}
                        alt={label}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = '<svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>';
                        }}
                    />
                </div>
                <p className={`${labelSize} text-gray-700 font-medium`}>{label}</p>
            </div>
        );
    };
    
    const RightArrowIcon = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => (
        <div className="text-gray-400 hover:text-gray-600 transition-colors duration-200">
            <svg className={`${size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-10 h-10' : 'w-8 h-8'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
        </div>
    );

    const renderTryOnContent = () => (
        <>
            {/* 标题 */}    
            <ModelSelect
                title="试穿模型"
                options={TryonModelOptions}
                value={TryonModelOptions[0].value}
                onChange={() => {}}
            />
            
            {/* 示例展示区域 */}
            <div className="mb-8 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex flex-col sm:flex-row justify-center items-center gap-8 overflow-x-auto">
                    {/* 产品图示例 */}
                    <SampleImageDisplay label="产品图" imgSrc="/TryOnImages/tryon_product.png" />
                    <div className="hidden sm:block flex-shrink-0">
                        <RightArrowIcon />
                    </div>
                    {/* 试穿效果示例 */}
                    <SampleImageDisplay label="试穿效果" imgSrc="/TryOnImages/tryon_result.png" />
                </div>
                <p className="text-center text-sm text-gray-500 mt-6 bg-gray-50 px-6 py-3 rounded-lg">
                    上传模特图和产品图片，系统会自动生成试穿效果
                </p>
            </div>

            {/* 图片上传区域 - 并排布局 */}
            <div className="mb-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                    {/* 模特图片上传 */}
                    <div>
                        <div className="flex items-center mb-4">
                            <span className="text-blue-500 mr-2">●</span>
                            <h2 className="text-lg lg:text-xl font-semibold text-gray-800">模特图片上传</h2>
                        </div>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-all duration-200">
                            <label className="cursor-pointer block">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={createImageUploadHandler(
                                        setModelImages, {maxCount: 1, replace: true}
                                    )}
                                />
                                <UploadIcon primaryLabel="点击上传模特图片" subLabel="支持 PNG, WEBP, JPEG, JPG 格式" />
                            </label>
                        </div>

                        {/* 显示已上传的模特图片 */}
                        {modelImages.length > 0 && (
                            <div className="mt-4">
                                <ImagePreview
                                    files={modelImages}
                                    showRemove={true}
                                    onRemove={(index: number) => RemoveFiles(setModelImages, index)}
                                    title=""
                                    imageHeight="h-64"
                                    gridCols="grid-cols-1 sm:grid-cols-2"
                                    buttonSize="w-5 h-5"
                                    className="border-2 border-gray-300 rounded-lg p-2"
                                />
                            </div>
                        )}
                    </div>

                    {/* 产品图片上传 */}
                    <div>
                        <div className="flex items-center mb-4">
                            <span className="text-green-500 mr-2">●</span>
                            <h2 className="text-lg lg:text-xl font-semibold text-gray-800">产品图片上传</h2>
                        </div>
                        
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 hover:bg-green-50 transition-all duration-200">
                            <label className="cursor-pointer block">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={createImageUploadHandler(
                                        setProductImages, {maxCount: 1, replace: true}
                                    )}
                                />
                                <UploadIcon primaryLabel="点击上传产品图片" subLabel="支持 PNG, WEBP, JPEG, JPG 格式" />
                            </label>
                        </div>

                        {/* 显示已上传的产品图片 */}
                        {productImages.length > 0 && (
                            <div className="mt-4">
                                <ImagePreview
                                    files={productImages}
                                    showRemove={true}
                                    onRemove={(index: number) => RemoveFiles(setProductImages, index)}
                                    title=""
                                    imageHeight="h-64"
                                    gridCols="grid-cols-1 sm:grid-cols-2"
                                    buttonSize="w-5 h-5"
                                    className="border-2 border-gray-300 rounded-lg p-2"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div> 
        </>
    );

    const renderProductRecontextContent = () => (
    <>
        {/* 标题 */}    
        <ModelSelect
        title="试穿模型"
        options={ProductRecontextModelOptions}
        value={ProductRecontextModelOptions[0].value}
        onChange={() => {}}
        />
    
        {/* 示例展示区域 */}
        <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 overflow-x-auto">
                {/* 产品图示例 */}
                <SampleImageDisplay label="产品图" imgSrc="/TryOnImages/recontext_product.png" size="sm" />
                <div className="hidden sm:block flex-shrink-0">
                    <RightArrowIcon size="sm" />
                </div>
                {/* 提示词 */}
                <div className="text-center flex-shrink-0">
                    <div className="w-36 h-48 bg-blue-50 rounded-xl border-2 border-dashed border-blue-200 flex items-center justify-center mb-3 p-3 hover:border-blue-300 transition-all duration-200 overflow-hidden">
                        <div className="text-center">
                            <svg className="w-6 h-6 text-blue-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <p className="text-xs font-semibold text-blue-700 mb-1">AI 提示词</p>
                            <p className="text-xs text-blue-600 leading-relaxed">
                                e.g. A pair of orange sneakers worn by a trendy, well dressed woman sitting on marble steps
                            </p>
                        </div>
                    </div>
                    <p className="text-xs text-gray-700 font-medium">提示词生成</p>
                </div>
                <div className="hidden sm:block flex-shrink-0">
                    <RightArrowIcon size="sm" />
                </div>
                {/* 试穿效果示例 */}
                <SampleImageDisplay label="效果图" imgSrc="/TryOnImages/recontext_result.png" size="sm" />
            </div>
            
            <p className="text-center text-xs text-gray-500 mt-4 bg-gray-50 px-4 py-2 rounded-lg">
                上传产品图和输入提示词，系统会自动生成试穿效果
            </p>
        </div>
            
        {/* 产品图片上传 */}
        <div className="mb-8">
            <div className="flex items-center mb-4">
                <span className="text-blue-500 mr-2">●</span>
                <h2 className="text-lg lg:text-xl font-semibold text-gray-800">上传1~3张产品图片</h2>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-all duration-200">
                <label className="cursor-pointer block">
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={createImageUploadHandler(
                            setProductImages, {maxCount: 3, replace: false}
                        )}
                    />
                    <UploadIcon primaryLabel='点击上传产品图片' subLabel='支持 PNG, WEBP, JPEG, JPG 格式'/>
                </label>
            </div>
            {/* 显示已上传的产品图片 */}
            {productImages.length > 0 && (
                <div className="mt-4">
                    <ImagePreview
                        files={productImages}
                        showRemove={true}
                        title=''
                        imageHeight="h-64"
                        gridCols="grid-cols-1 sm:grid-cols-2"
                        buttonSize="w-5 h-5"
                        onRemove={(index: number) => RemoveFiles(setProductImages, index)}
                    />
                </div>
            )}
        </div>
            
        {/* 提示词输入框 */}
        <div className="mb-8">
            <div className="flex items-center mb-4">
                <span className="text-green-500 mr-2">●</span>
                <h2 className="text-lg lg:text-xl font-semibold text-gray-800">请输入提示词</h2>
            </div>
            <div>
                <textarea
                        className="w-full h-32 lg:h-36 p-4 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 
                        focus:border-blue-500 bg-white resize-none placeholder-gray-500 text-black text-sm lg:text-base leading-relaxed
                        hover:border-gray-400 transition-all duration-200"
                        placeholder="请输入风格描述，例如：时尚、休闲、商务、运动等风格要求"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)} 
                />
            </div>
        </div>
        
        {/* 产品描述输入框 */}
        <div className="mb-8">
            <div className="flex items-center mb-4">
                <span className="text-purple-500 mr-2">●</span>
                <h2 className="text-lg lg:text-xl font-semibold text-gray-800">产品描述（非必填）</h2>
            </div>
            <div>
                <textarea
                        className="w-full h-16 lg:h-20 p-4 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 
                        focus:border-blue-500 bg-white resize-none placeholder-gray-500 text-black text-sm lg:text-base leading-relaxed
                        hover:border-gray-400 transition-all duration-200"
                        placeholder="请输入产品的详细描述"
                        value={productDescription}
                        onChange={(e) => setProductDescription(e.target.value)} 
                />
            </div>
        </div>
    </>
    );

    // 左侧内容
    const leftContent = (
        <>
                                {activeTab === TryOnTab && renderTryOnContent()}
                                {activeTab === ProductRecontextTab && renderProductRecontextContent()}
                                
                                {/* 生成按钮 */}
                                <div className="flex justify-center my-6">
                                    <button
                                        onClick={handleGenerate}
                                        className={`
                                            px-8 py-4 rounded-xl font-semibold text-lg shadow-lg transition-all duration-300 transform
                                            flex items-center space-x-3 min-w-[200px] justify-center
                                            ${isGenerating 
                                            ? 'bg-gray-400 cursor-not-allowed' 
                                            :'bg-blue-600 hover:bg-blue-700 text-white'
                                                // : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white hover:scale-105 hover:shadow-xl'
                                            }
                                        `}
                                        disabled={isGenerating}
                                    >
                                        {isGenerating ? (
                                            <>
                                                <LoadingSpinner />
                                                <span>生成中...</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                                <span>生成试穿效果图</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                                
                                {/* 参数设置区域 */}
                                {(Object.keys(configSelections).length > 0) && (
                                    <ConfigurationPanel
                                        title="设置"
                                        titleColor="text-purple-500"
                                        configSelections={configSelections}
                                        configs={getCurrentConfigs(activeTab)}
                                        onConfigChange={(configId, value) => {
                                            setConfigSelections(prev => ({
                                                ...prev,
                                                [configId]: value
                                            }));
                                    }}
                                />)}  
        </>
    );



    // 中间内容 - 生成结果
    const centerContent = (
        <>
                        <div className="flex items-center mb-6 lg:mb-8">
                            <span className="text-green-500 mr-2">●</span>
                            <span className="text-xl font-semibold text-gray-800">生成结果</span>
                        </div>
                        {generatedImages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 lg:h-3/5 text-gray-400 bg-white rounded-xl border-2 border-dashed border-gray-200">
                                <ImageGenerateResultIcon 
                                    primaryText="试穿效果将在这里显示"
                                    secondaryText={activeTab === TryOnTab ? "请上传模特和产品图片，然后点击生成按钮开始创作" : "请上传产品图片和输入提示词，然后点击生成按钮开始创作"}
                                />
                            </div>
                        ) : (
                        <>
                            <ImagePreview
                                urlImages={generatedImages}
                                showRemove={false}
                                showDownload={true}
                                showBatchDownload={false}
                                onDownload={(index, data) => downloadSingleFile(data as MediaFile)}
                                onBatchDownload={() => downloadAllFiles(generatedImages)}
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

    // 右侧内容 - 任务历史记录
    const rightContent = (
        <>
            <div className="flex items-center mb-6">
                <span className="text-blue-500 mr-2">●</span>
                <span className="text-xl font-semibold text-gray-800">历史记录</span>
            </div>
            <TaskHistory
                path="tryon"
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
        </>
    );
}