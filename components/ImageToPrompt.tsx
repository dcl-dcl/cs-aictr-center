'use client'
import { useState, useRef, useEffect } from 'react'

interface ImageToPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPrompt: (prompt: string) => void;
}

export default function ImageToPrompt({ isOpen, onClose, onApplyPrompt }: ImageToPromptProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 弹窗打开时重置状态
  useEffect(() => {
    if (isOpen) {
      setError('');
      setGeneratedPrompt('');
      setIsCopied(false);
    }
  }, [isOpen]);

  // 监听ESC键关闭弹窗
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // 自动重置复制状态
  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => setIsCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  // 处理图片上传
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        setError('请选择图片文件');
        return;
      }
      
      // 覆盖原来的文件，重置相关状态
      setSelectedImage(file);
      setError('');
      setGeneratedPrompt('');
      setIsCopied(false);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
    
    // 清空input的value，允许重新选择相同文件
    event.target.value = '';
  };

  const generatePrompt = async () => {
    if (!selectedImage) {
      setError('请先上传图片');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('target', 'image');

      const response = await fetch('/api/image2prompt', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || '生成提示词失败')
      }
      setGeneratedPrompt(result.resultData.prompt);
    } catch (error) {
      setError(`${error}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // 应用提示词
  const handleApplyPrompt = () => {
    if (generatedPrompt) {
      onApplyPrompt(generatedPrompt);
      onClose();
    }
  };

  // 处理复制功能
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setIsCopied(true);
      // 移除setTimeout，改用useEffect管理
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  // 重置状态
  const resetState = () => {
    setSelectedImage(null);
    setImagePreview('');
    setGeneratedPrompt('');
    setError('');
    setIsGenerating(false);
    setIsCopied(false);
  };

  // 关闭弹窗时重置状态
  const handleClose = () => {
    resetState();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-[rgba(60,53,53,0.5)] bg-opacity-30 flex items-center justify-center z-50 animate-fadeIn'>
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto animate-scaleIn border border-gray-100">
        {/* 隐藏的文件输入框 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        {/* 标题栏 */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-800">图片提示词生成器</h2>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 主要内容区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[500px]">
          {/* 左侧：图片上传区域 */}
          <div className="flex flex-col">
            <div className="flex items-center mb-6">
              <span className="text-orange-500 mr-2">●</span>
              <h3 className="text-xl font-semibold text-gray-800">上传图片</h3>
            </div>
            
            {/* 图片上传区域 */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 flex-1 flex flex-col justify-center">
              {imagePreview ? (
                <div className="space-y-6">
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="预览图片"
                      className="max-w-full max-h-64 mx-auto rounded-lg shadow-sm border border-gray-200"
                    />
                  </div>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors border border-gray-200 flex items-center gap-2 min-w-[120px] h-[40px] justify-center font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span className="text-sm">重新选择</span>
                    </button>
                    <button
                      onClick={generatePrompt}
                      disabled={isGenerating}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-200 font-medium shadow-sm hover:shadow-md min-w-[120px] h-[40px] justify-center"
                    >
                      {isGenerating ? (
                        <>
                          <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span className="text-sm">生成中...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          <span className="text-sm">生成提示词</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-gray-600 mb-4">点击或拖拽图片到此处上传</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-all duration-200 font-medium shadow-sm hover:shadow-md min-w-[120px] h-[40px] flex items-center justify-center gap-2 mx-auto"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm">选择图片</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 右侧：生成的提示词区域 */}
          <div className="flex flex-col">
            <div className="flex items-center mb-6">
              <span className="text-green-500 mr-2">●</span>
              <h3 className="text-xl font-semibold text-gray-800">生成提示词</h3>
            </div>
            
            {/* 提示词显示区域 */}
            <div className="border border-gray-200 rounded-lg bg-gray-50 flex-1 flex flex-col min-h-0">
              {error ? (
                <div className="text-red-600 text-center py-8 px-6">
                  <svg className="mx-auto h-8 w-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              ) : generatedPrompt ? (
                <div className="flex flex-col h-full min-h-0">
                  {/* 可滚动的文本内容区域 */}
                  <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 pb-4 min-h-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    <div className="text-gray-800 whitespace-pre-wrap leading-relaxed break-words">{generatedPrompt}</div>
                  </div>
                  {/* 固定在底部的按钮区域 */}
                  <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 px-6 py-4">
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={handleCopy}
                        className={`px-4 py-2 rounded-lg transition-colors border flex items-center gap-2 min-w-[100px] h-[40px] justify-center font-medium ${
                          isCopied 
                            ? 'bg-green-100 text-green-700 border-green-200' 
                            : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm">已复制</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm">复制</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleApplyPrompt}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md min-w-[140px] h-[40px] flex items-center justify-center gap-2"
                        >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                          <span className="text-sm">应用到提示词</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6">
                  <div className="w-16 h-16 mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium mb-2">等待生成提示词</p>
                  <p className="text-sm">上传图片后点击"生成提示词"按钮</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

