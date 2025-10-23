'use client';

import React, { useState } from 'react';
import { Upload, Input, Button, List, Card, message, theme, Tabs, Image } from 'antd';
import { 
  PictureOutlined, HistoryOutlined, CloudUploadOutlined,
  ThunderboltOutlined, EyeOutlined, DownloadOutlined, ReloadOutlined,
 } from '@ant-design/icons';
import GoodsLayout from '@/components/GoodsLayout';
import ErrorModal from '@/components/ErrorModal';
import { ImageUpload } from '@/components/ImageUpload';
import { downloadSingleFile, MediaType } from '@/components/MediaPreview';
import { MediaFile } from '@/types/BaseType'
import { AspectRatioOptions, productExamples, recommendedScenesTabs, GoodsGenImageModel } from '@/constants/GoodsData';


const { TextArea } = Input;
const FakeHistoryRecords = [
  {
    id: '1',
    image: '',
    prompt: '简约风格商品展示',
    time: '2分钟前',
    status: '已完成'
  },
  {
    id: '2',
    image: '',
    prompt: '高端奢华展示效果',
    time: '5分钟前',
    status: '已完成'
  }
]

// CardWrapper组件 - 用于包装Card组件
const CardWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-white rounded-lg p-1">
    {children}
  </div>
);

// // LightingButton组件 - 用于渲染光源按钮
// const LightingButton: React.FC<{
//   option: { value: string; label: string };
//   isSelected: boolean;
//   onClick: () => void;
// }> = ({ option, isSelected, onClick }) => (
//   <Button
//     key={option.value}
//     type={isSelected ? 'primary' : 'default'}
//     size="middle"
//     onClick={onClick}
//     className={`h-10 text-sm ${
//       isSelected 
//         ? 'bg-orange-400 border-orange-400 text-white' 
//         : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-orange-300'
//     }`}
//   >
//     {option.label}
//   </Button>
// );

// 场景渲染组件
const SceneRenderer = ({ scenes, isExpanded, onToggleExpanded, selectedScene, setSelectedScene }: {
  scenes: any[];
  isExpanded: boolean;
  onToggleExpanded: () => void;
  selectedScene: string;
  setSelectedScene: (scene: string) => void;
}) => (
  <div>
    <div className="grid grid-cols-4 gap-2 mt-2">
      {(isExpanded ? scenes : scenes.slice(0, 12)).map((scene) => (
        <div
          key={scene.key || scene.id}
          className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 aspect-square ${
            selectedScene === (scene.key || scene.id)
              ? 'border-blue-500 shadow-md' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => setSelectedScene(scene.key || scene.id)}
        >
          {scene.image ? (
            <div className="w-full h-full">
              <Image
                src={scene.image}
                alt={scene.name}
                className="w-full h-full object-cover"
                preview={false}
              />
            </div>
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center"
              style={{ background: scene.color || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              <div className="w-8 h-8 bg-white/20 rounded-full"></div>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs py-1 px-2 text-center">
            {scene.name}
          </div>
        </div>
      ))}
    </div>
    {scenes.length > 12 && (
      <div className="mt-4 text-center">
        <Button 
          type="link" 
          size="small" 
          className="text-blue-500"
          onClick={onToggleExpanded}
        >
          {isExpanded ? '收起' : '展开全部'}
        </Button>
      </div>
    )}
  </div>
);

// 画面比例按钮组件
const AspectRatioButton: React.FC<{
  ratio: string;
  isSelected: boolean;
  onClick: () => void;
}> = ({ ratio, isSelected, onClick }) => {
  // 根据比例计算显示的宽高
  const getRatioDimensions = (ratio: string) => {
    const [width, height] = ratio.split(':').map(Number);
    const containerSize = 28; // 容器内可用空间
    
    // 计算缩放比例，确保矩形能完全显示在容器内
    const scaleW = containerSize / width;
    const scaleH = containerSize / height;
    const scale = Math.min(scaleW, scaleH);
    
    return {
      width: Math.max(Math.round(width * scale), 8), // 最小宽度8px
      height: Math.max(Math.round(height * scale), 8) // 最小高度8px
    };
  };

  const dimensions = getRatioDimensions(ratio);

  return (
    <div
      className={`cursor-pointer p-2 rounded-lg border-2 transition-all duration-200 w-16 h-16 ${
        isSelected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onClick}
    >
      {/* 主要修改：使用 flex-col 和 justify-between 让内容分布在两端 */}
      <div className="flex flex-col items-center justify-between h-full">
        {/* 矩形区域 - 在上方 */}
        <div 
          className={`rounded border-2 ${
            isSelected ? 'bg-blue-500 border-blue-500' : 'bg-gray-100 border-gray-300'
          }`}
          style={{
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`
          }}
        ></div>
        
        {/* 文字区域 - 在底部 */}
        <div className="text-center">
          <span className="text-xs font-medium leading-none">{ratio}</span>
        </div>
      </div>
    </div>
  );
};

const GoodsPage: React.FC = () => {
  const { token } = theme.useToken();
  const ConfigCardStyle = {
    header: { 
      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
      borderBottom: `1px solid ${token.colorBorderSecondary}`,
      fontSize: '14px',
      fontWeight: 500
    },
    body: { 
      background: token.colorBgContainer,
      padding: '16px'
    }
  };
  // 状态管理
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [lighting, setLighting] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedImages, setGeneratedImages] = useState<Array<MediaFile>>([]);
  const [activeSceneTab, setActiveSceneTab] = useState<string>(recommendedScenesTabs[0].key);
  const [selectedScene, setSelectedScene] = useState<string>('');
  const [isSceneExpanded, setIsSceneExpanded] = useState<boolean>(false);
  const [history, setHistory] = useState<{
    id: string;
    image: string;
    prompt: string;
    time: string;
    status: string;
  }[]>(FakeHistoryRecords);
  const [errorStat, setErrorStat] = useState<{showError: boolean, error: string}>({showError: false, error: ''});
  const [currentExampleImages, setCurrentExampleImages] = useState(productExamples);
  console.log(currentExampleImages)

  // 处理生成请求
  const handleGenerate = async () => {
    if (!uploadedImage) {
      setErrorStat({showError: true, error: '请先上传商品图片'});
      return;
    }
    if (!prompt) {
      setErrorStat({showError: true, error: '请输入创意描述或选择创意灵感'});
      return;
    }
    setIsGenerating(true);
    // 准备请求参数
    const reqFormData = new FormData();
    //请帮我把图片以列表方式传入
    reqFormData.append('inputImages', uploadedImage);
    reqFormData.append('prompt', prompt);
    reqFormData.append('configParameters', JSON.stringify({'aspectRatio': aspectRatio}));
    reqFormData.append('modelName', GoodsGenImageModel);

    //发送请求
    try {
      const response = await fetch('/api/imagen', {
        method: 'POST',
        body: reqFormData,
      });
        const result = await response.json();
        if (!result.success || !result?.resultData) {
            throw new Error(result?.message || '生成失败，请重试')
        }
        setGeneratedImages(result.resultData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setErrorStat({showError: true, error: `生成图片失败：${errorMessage}`});
    } finally {
      setIsGenerating(false);
    }
  };

  // 处理示例图片点击，将图片转换为File对象并上传
  const handleExampleImageClick = async (product: any) => {
    try {
      // 从图片URL获取图片数据
      const response = await fetch(product.image);
      const blob = await response.blob();
      // 创建File对象
      const file = new File([blob], `${product.name}.webp`, { type: blob.type });
      // 设置到uploadedImage状态
      setUploadedImage(file);
      // 显示成功消息
      message.success(`已选择${product.name}作为商品图片`);
    } catch (error) {
      console.error('加载示例图片失败:', error);
      message.error('加载示例图片失败，请重试');
    }
  };

  // 处理场景选择，同时更新prompt
  const handleSceneSelect = (sceneKey: string) => {
    setSelectedScene(sceneKey);
    // 查找选中场景的prompt
    const currentTab = recommendedScenesTabs.find(tab => tab.key === activeSceneTab);
    if (currentTab) {
      const selectedSceneData = currentTab.children.find(scene => scene.key === sceneKey);
      if (selectedSceneData && selectedSceneData.prompt) {
        const positivePrompt = `请抠图出我提供给你的图片中的商品，保持商品原样细节，以合适的样式放置在以下描述的场景中，使他们尽可能融合得自然一些：\n${selectedSceneData.prompt}`;
        setPrompt(positivePrompt);
      }
    }
  };

  // 左侧面板内容
  const leftContent = (
    <div className="space-y-4">
      {/* 上传商品图 */}
      <CardWrapper>
        <Card 
        title="上传商品图"
        className="border-blue-100 shadow-sm hover:shadow-md transition-shadow duration-300"
        styles={ConfigCardStyle}
      >
        <ImageUpload
            imageUrl={uploadedImage ? URL.createObjectURL(uploadedImage) : ''}
            onImageChange={(file) => {setUploadedImage(file)}}
            title="商品图片"
        />
        <div className="mt-3 text-xs text-gray-400 flex items-center justify-center">
          <span className="mr-1">ⓘ</span>
          请上传清晰的商品图，不要包含杂乱的背景
        </div>
        
       </Card>
       </CardWrapper>

      {/* 灵感创意 */}
      <CardWrapper>
        <Card 
        title="灵感创意"
        className="border-blue-100 shadow-sm hover:shadow-md transition-shadow duration-300"
        styles={ConfigCardStyle}
      >
        <div className="space-y-4">
          {/* 创意灵感描述输入框 */}
            <div>
              <div className="text-sm text-gray-800 mb-2">
                <span className="text-blue-500 mr-2">●</span>
                创意灵感描述
              </div>
            <TextArea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="请输入您的创意灵感描述，例如：温馨的家居场景、现代简约风格、自然光线等..."
              autoSize={{ minRows: 3, maxRows: 6 }}
              className="border-2 hover:border-blue-300 focus:border-blue-400 transition-colors"
            />
          </div>
            
            {/* 推荐灵感选择 */}
          <div>
              <div className="text-sm text-gray-800 mb-2">
                <span className="text-blue-500 mr-2">●</span>
                创意灵感推荐
              </div>
            <Tabs
              activeKey={activeSceneTab}
              onChange={setActiveSceneTab}
              size="small"
              items={recommendedScenesTabs.map((tab) => ({
                  key: tab.key,
                  label: tab.name,
                  children: (
                    <SceneRenderer
                      scenes={tab.children}
                      isExpanded={isSceneExpanded}
                      onToggleExpanded={() => setIsSceneExpanded(!isSceneExpanded)}
                      selectedScene={selectedScene}
                      setSelectedScene={handleSceneSelect}
                    />
                  )
                }))}
            />
          </div>
        </div>
      </Card>
      </CardWrapper>

      {/* 画面比例 */}
      <CardWrapper>
        <Card 
        title="画面比例"
        className="border-blue-100 shadow-sm hover:shadow-md transition-shadow duration-300"
        styles={ConfigCardStyle}
      >
        <div className="grid grid-cols-5 gap-2">
          {AspectRatioOptions.slice(0, 10).map((option) => (
            <AspectRatioButton
              key={option.value}
              ratio={option.value as string}
              isSelected={aspectRatio === option.value}
              onClick={() => setAspectRatio(option.value as string)}
            />
          ))}
        </div>
      </Card>
      </CardWrapper>

      {/* 预设光源 */}
      {/* <CardWrapper>
        <Card 
        title="预设光源"
        className="border-blue-100 shadow-sm hover:shadow-md transition-shadow duration-300"
        styles={ConfigCardStyle}
      >
        <div className="grid grid-cols-4 gap-2">
          {LightingOptions.map((option) => (
            <LightingButton
              key={option.value}
              option={option}
              isSelected={lighting === option.value}
              onClick={() => setLighting(option.value)}
            />
          ))}
        </div>
      </Card>
      </CardWrapper> */}

      {/* 生成按钮 */}
      <CardWrapper>
        <Button 
          type="primary" 
          size="large" 
          icon={<ThunderboltOutlined />}
          loading={isGenerating}
          onClick={handleGenerate}
          className="w-full h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-blue-500 to-purple-600 border-0 hover:from-blue-600 hover:to-purple-700"
          style={{
            background: isGenerating 
              ? 'linear-gradient(45deg, #94a3b8, #cbd5e1)' 
              : 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
          }}
        >
          {isGenerating ? '生成中...' : '开始生成'}
        </Button>
      </CardWrapper>
    </div>
  );

  // 中间面板内容
  const centerContent = (
    <div className="space-y-6">
      <Card 
        title={
          <div className="flex items-center space-x-2 text-gray-700">
            <EyeOutlined className="text-lg" />
            <span>图片预览</span>
          </div>
        }
        className="border-gray-100"
        styles={{
          header: { 
            background: 'linear-gradient(135deg, rgba(156, 163, 175, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
            borderBottom: `1px solid ${token.colorBorderSecondary}`
          },
          body: { 
            background: token.colorBgContainer,
            padding: '24px'
          }
        }}
        >
          <div className="grid grid-cols-2 gap-8">
            {/* 原图预览 */}
            <div>
              <div className="mb-3 font-medium text-gray-700">原始商品图</div>
              <div className="aspect-square border-2 border-dashed border-blue-200 rounded-lg flex items-center justify-center bg-white shadow-inner hover:border-blue-300 transition-colors">
                {uploadedImage ? (
                  <Image
                    src={uploadedImage ? URL.createObjectURL(uploadedImage) : ''}
                    alt="原图"
                    className="w-full h-full object-contain rounded-lg"
                    preview={{
                      mask: '预览',
                    }}
                  />
                ) : (
                  <div className="text-gray-400 flex flex-col items-center">
                    <CloudUploadOutlined className="text-4xl mb-2" />
                    <span>等待上传</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* 生成结果预览 */}
            <div>
              <div className="mb-3 font-medium text-gray-700">
              <span>AI 生成结果</span>
              </div>
              <div className="aspect-square border-2 border-dashed border-purple-200 rounded-lg flex items-center justify-center bg-white shadow-inner hover:border-purple-300 transition-colors">
                {isGenerating ? (
                  <div className="text-purple-600 flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 mb-2"></div>
                    <span>生成中...</span>
                  </div>
              ) : generatedImages.length > 0 ? (
                  <>
                    <div className="relative w-full h-full">
                    <Image
                      src={generatedImages[0].url}
                      alt="生成结果"
                      className="w-full h-full object-contain rounded-lg"
                      preview={{mask: '预览'}}
                    />
                    </div>
                  </>
                ) : (
                  <div className="text-gray-400 flex flex-col items-center">
                    <span role="img" aria-label="magic" className="text-4xl mb-2">✨</span>
                    <span>等待生成</span>
                  </div>
                )}
              </div>
            </div>
          </div>
      </Card>
      <div className="mt-25"></div>
      {/* 商品示例图选择 */}
      <Card
        title={
          <div className="flex items-center justify-between w-full">
            <span className="text-gray-800 font-medium">示例商品</span>
            <Button
              type="text"
              icon={<ReloadOutlined />}
              className="text-gray-600 hover:text-gray-800"
              onClick={() => {
                // 随机打乱商品顺序
                const shuffled = [...productExamples].sort(() => 0.5 - Math.random());
                setCurrentExampleImages(shuffled);
              }}
            >
              换一换
            </Button>
          </div>
        }
        className="border-gray-200"
        styles={{
          header: { 
            background: '#fafafa',
            borderBottom: `1px solid ${token.colorBorderSecondary}`
          },
          body: { 
            background: token.colorBgContainer,
            padding: '16px 20px'
          }
        }}
      >
        <div className="grid grid-cols-6 gap-4">
        {currentExampleImages.map((product) => (
          <div 
            key={product.key} 
            className="group relative cursor-pointer"
            onClick={() => handleExampleImageClick(product)}
          >
            <Image
              src={product.image}
              alt={product.name}
              preview={false}
              className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-200 rounded-md"
            />
          </div>
        ))}
            
        </div>
      </Card>
    </div>
  );

  // 右侧面板内容
  const rightContent = (
    <Card 
      title={
        <div className="flex items-center space-x-2 text-purple-600">
          <HistoryOutlined className="text-lg" />
          <span>历史记录</span>
        </div>
      }
      className="h-full border-purple-100"
      styles={{
        header: { 
          background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)',
          borderBottom: `1px solid ${token.colorBorderSecondary}`
        },
        body: { 
          background: token.colorBgContainer,
          height: 'calc(100% - 57px)',
          padding: '16px'
        }
      }}
    >
        <List
          dataSource={history}
          renderItem={(item) => (
            <List.Item key={item.id}>
              <Card 
                className="w-full mb-4 hover:shadow-md transition-shadow duration-300 border-gray-100"
                styles={{
                  body: { padding: '12px' }
                }}
              >
                <div className="flex items-start space-x-4">
                  <div className="w-24 h-24 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.prompt}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <PictureOutlined className="text-gray-300 text-2xl" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {item.prompt}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{item.time}</div>
                    <div className="mt-2">
                      <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full font-medium">
                        {item.status}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </List.Item>
          )}
        />
      </Card>
    );

  return (
    <>
    <GoodsLayout
      leftContent={<div className="p-6">{leftContent}</div>}
      centerContent={<div className="p-6">{centerContent}</div>}
      rightContent={<div className="p-6">{rightContent}</div>}
      showDividers={true}
    />
    <ErrorModal
      isOpen={errorStat.showError}
      error={errorStat.error}
      onClose={() => setErrorStat({showError: false, error: ''})}
    />
    </>
  );
};

export default GoodsPage;