import React from 'react';
import { apiFetch } from '@/lib/utils/api-client';
import { MediaFile } from '@/types/BaseType'
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';

export interface ImageWithBase64 {
    base64Data: string;
    mimeType: string;
}
  
export interface ImageWithUrl {
  id?: string;
  url: string;
  gcsUri?: string;
  filename: string;
  mimeType: string;
}

interface ImagePreviewProps {
  files?: File[];
  base64Images?: ImageWithBase64[];
  urlImages?: ImageWithUrl[];
  
  // 回调函数
  onRemove?: (index: number, type: 'file' | 'base64' | 'url') => void;
  onDownload?: (index: number, data: string | ImageWithUrl | File) => void;
  onBatchDownload?: () => void;
  onGenerateVideo?: (index: number, data: string | ImageWithUrl | File) => void;
  
  // 显示配置
  title: string;
  maxImages?: number;
  gridCols?: string;
  imageHeight?: string;
  buttonSize?: string;
  showDownload?: boolean;
  showRemove?: boolean;
  showBatchDownload?: boolean;
  showGenerateVideo?: boolean;
  
  // 样式配置
  className?: string;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  files = [],
  base64Images = [],
  urlImages = [],
  onRemove,
  onDownload,
  onBatchDownload,
  onGenerateVideo,
  title = "",
  gridCols = "grid-cols-2 md:grid-cols-3",
  imageHeight = "h-40",
  buttonSize = "w-5 h-5",
  showDownload = false,
  showRemove = true,
  showBatchDownload = false,
  showGenerateVideo = false,
  className = ""
}) => {
  const createImagePreview = (file: File) => {
    return URL.createObjectURL(file);
  };
  
  const allImages: Array<{
    type: 'file' | 'base64' | 'url';
    src: string;
    name: string;
    index: number;
    originalIndex: number;
    id?: number | string;
    mimeType?: string;
    data?: string | ImageWithUrl | File;
  }> = [
    // File类型图片
    ...files.map((file, index) => ({
        type: 'file' as const,
        src: createImagePreview(file),
        name: file.name,
        index: index,
        originalIndex: index,
        data: file
    })),
    // Base64图片
    ...base64Images.map((item, index) => ({
        type: 'base64' as const,
        src: `data:${item.mimeType};base64,${item.base64Data}`,
        name: `生成结果 ${index + 1}`,
        index: files.length + index,
        originalIndex: index,
        data: item.base64Data
    })),
    // url图片
    ...urlImages.map((image, index) => ({
        type: 'url' as const,
        src: image.url,
        name: image.filename,
        index: files.length + base64Images.length + index,
        originalIndex: index,
        id: image.id,
        mimeType: image.mimeType,
        data: image
    })),
  ];

  if (allImages.length === 0) return null;

  const handleRemove = (item: typeof allImages[0]) => {
    if (onRemove) {
      onRemove(item.index, item.type);
    }
  };

  const handleDownload = (item: typeof allImages[0]) => {
    if (onDownload) {
      onDownload(item.originalIndex, item.data || item.src);
    } else if (item.type === 'url' && item.data) {
      const image = item.data as ImageWithUrl;
      const link = document.createElement('a');
      link.href = image.url;
      link.download = image.filename;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleGenerateVideo = (item: typeof allImages[0]) => {
    if (onGenerateVideo) {
      onGenerateVideo(item.originalIndex, item.data || item.src);
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-700">{title}</h4>
        {/* 批量下载按钮 */}
        {showBatchDownload && onBatchDownload && allImages.length > 1 && (
          <button
            onClick={onBatchDownload}
            className="px-5 py-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1.5 text-xs font-medium shadow-sm hover:shadow-md"
            title="下载全部图片"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            下载全部
          </button>
        )}
      </div>
      <PhotoProvider>
        <div className={`grid ${gridCols} gap-3 w-full overflow-hidden`} style={{ minWidth: 0 }}>
          {allImages.map((item, index) => (
            <div key={item.id || `${item.type}-${index}`} className="relative group min-w-0 max-w-full overflow-hidden">
              <PhotoView src={item.src}>
                <div className={`relative w-full ${imageHeight} bg-gray-50 rounded-md border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 media-container`} style={{ minWidth: 0, minHeight: 0, maxWidth: '100%' }}>
                  <img 
                    src={item.src} 
                    alt={item.name}
                    className="absolute inset-0 w-full h-full object-contain transition-opacity duration-200 hover:opacity-90"
                    style={{ minWidth: 0, minHeight: 0, maxWidth: '100%', maxHeight: '100%' }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-image.svg';
                    }}
                  />
                </div>
              </PhotoView>
              
              {/* 按钮容器 */}
              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                {/* 删除按钮 */}
                {showRemove && onRemove && (
                  <button
                    onClick={() => handleRemove(item)}
                    className={`bg-red-500 text-white rounded-full ${buttonSize} flex items-center justify-center text-xs hover:bg-red-600`}
                    title="删除图片"
                  >
                    ×
                  </button>
                )}
                
                {/* 下载按钮 */}
                {showDownload && (
                  <button
                    onClick={() => handleDownload(item)}
                    className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs hover:bg-blue-600"
                    title="下载图片"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                )}
                
                {/* 生成视频按钮 */}
                {showGenerateVideo && onGenerateVideo && (
                  <button
                    onClick={() => handleGenerateVideo(item)}
                    className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs hover:bg-purple-600"
                    title="生成视频"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* 放大图标提示 */}
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
              
              {/* 图片信息 */}
              <div className="mt-2">
                <p className="text-xs text-gray-500 truncate" title={item.name}>{item.name}</p>
                {item.mimeType && (
                  <p className="text-xs text-gray-400">{item.mimeType}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </PhotoProvider>
    </div>
  );
};

// VideoPreview组件的接口定义
interface VideoPreviewProps {
  files?: File[];
  urlVideos?: MediaFile[];
  // 回调函数
  onRemove?: (index: number, type: 'file' | 'url') => void;
  onDownload?: (index: number, data: string | MediaFile | File) => void;
  onBatchDownload?: () => void;
  
  // 显示配置
  title: string;
  maxVideos?: number;
  gridCols?: string;
  videoHeight?: string;
  buttonSize?: string;
  showDownload?: boolean;
  showRemove?: boolean;
  showBatchDownload?: boolean;
  // 样式配置
  className?: string;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  files = [],
  urlVideos = [],
  onRemove,
  onDownload,
  onBatchDownload,
  title = "",
  gridCols = "grid-cols-1 md:grid-cols-2",
  videoHeight = "h-60",
  buttonSize = "w-5 h-5",
  showDownload = false,
  showRemove = true,
  showBatchDownload = false,
  className = ""
}) => {
  const [videoThumbnails, setVideoThumbnails] = React.useState<{ [key: string]: string }>({});

  const createVideoPreview = (file: File) => {
    return URL.createObjectURL(file);
  };

  // 生成视频缩略图的函数
  const generateVideoThumbnail = (videoElement: HTMLVideoElement, videoId: string) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      ctx.drawImage(videoElement, 0, 0);

      const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
      setVideoThumbnails(prev => ({
        ...prev,
        [videoId]: thumbnailUrl
      }));
    } catch (error) {
      console.warn('无法生成视频缩略图，可能是跨域问题:', error);
    }
  };

  // 根据aspectRatio判断视频方向
  const getVideoContainerClass = (aspectRatio?: string) => {
    if (!aspectRatio) {
      return "aspect-video"; // 默认横版
    }
    // 解析aspectRatio，格式可能是 "16:9", "9:16", "1:1" 等
    const [width, height] = aspectRatio.split(':').map(Number);
    
    if (width && height) {
      const ratio = width / height;
      // 如果宽高比小于1，说明是竖版视频
      if (ratio < 1) {
        return "aspect-[9/16]"; // 竖版比例
      } else if (ratio === 1) {
        return "aspect-square"; // 正方形
      } else {
        return "aspect-video"; // 横版比例 (16:9)
      }
    }
    return "aspect-video"; // 默认横版
  };
  
  const allVideos: Array<{
    type: 'file' | 'url';
    src: string;
    name: string;
    index: number;
    originalIndex: number;
    id?: number | string;
    mimeType?: string;
    aspectRatio?: string;
    data?: string | MediaFile | File;
  }> = [
    // File类型视频
    ...files.map((file, index) => ({
      type: 'file' as const,
      src: createVideoPreview(file),
      name: file.name,
      index: index,
      originalIndex: index,
      data: file
    })),
    // URL视频
    ...urlVideos.map((video, index) => ({
      type: 'url' as const,
      src: video.url,
      name: video.filename,
      index: files.length + index,
      originalIndex: index,
      id: video.id,
      mimeType: video.mimeType,
      aspectRatio: video.aspectRatio,
      data: video
    })),
  ];

  if (allVideos.length === 0) return null;

  const handleRemove = (item: typeof allVideos[0]) => {
    if (onRemove) {
      onRemove(item.originalIndex, item.type);
    }
  };

  const handleDownload = (item: typeof allVideos[0]) => {
    if (onDownload) {
      onDownload(item.originalIndex, item.data || item.src);
    } else if (item.type === 'url' && item.data) {
      downloadSingleFile(item.data as MediaFile, MediaType.VIDEO);
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-700">{title}</h4>
        {/* 批量下载按钮 */}
        {showBatchDownload && onBatchDownload && allVideos.length > 1 && (
          <button
            onClick={onBatchDownload}
            className="px-5 py-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1.5 text-xs font-medium shadow-sm hover:shadow-md"
            title="下载全部视频"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            下载全部
          </button>
        )}
      </div>
      
      <div className={`grid ${gridCols} gap-3 w-full overflow-hidden`} style={{ minWidth: 0 }}>
        {allVideos.map((item, index) => (
          <div key={item.id || `${item.type}-${index}`} className="relative group min-w-0 max-w-full overflow-hidden">
            <div className={`relative w-full ${videoHeight} bg-gray-50 rounded-md border border-gray-200 overflow-hidden media-container`} style={{ minWidth: 0, minHeight: 0, maxWidth: '100%' }}>
              <video 
                src={item.src}
                className={`absolute inset-0 w-full h-full object-contain ${getVideoContainerClass(item.aspectRatio)}`}
                style={{ minWidth: 0, minHeight: 0, maxWidth: '100%', maxHeight: '100%' }}
                controls
                preload="metadata"
                onLoadedMetadata={(e) => {
                  const video = e.target as HTMLVideoElement;
                  const videoId = item.id?.toString() || `${item.type}-${index}`;
                  // 设置视频时间到第一帧来生成缩略图
                  video.currentTime = 0.1;
                  video.addEventListener('seeked', () => {
                    generateVideoThumbnail(video, videoId);
                  }, { once: true });
                }}
                onError={(e) => {
                  console.error('视频加载失败:', item.src);
                }}
              >
                您的浏览器不支持视频播放。
              </video>
            </div>
            
            {/* 删除按钮 */}
            {showRemove && onRemove && (
              <button
                onClick={() => handleRemove(item)}
                className={`absolute top-1 right-1 bg-red-500 text-white rounded-full ${buttonSize} flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-600`}
                title="删除视频"
              >
                ×
              </button>
            )}
            
            {/* 下载按钮 */}
            {showDownload && (
              <button
                onClick={() => handleDownload(item)}
                className="absolute top-1 right-1 bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-blue-600"
                title="下载视频"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
            )}
            
            {/* 播放图标提示 */}
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            
            {/* 视频信息 */}
            <div className="mt-2">
              <p className="text-xs text-gray-500 truncate" title={item.name}>{item.name}</p>
              {item.mimeType && (
                <p className="text-xs text-gray-400">{item.mimeType}</p>
              )}
              {item.aspectRatio && (
                <p className="text-xs text-gray-400">比例: {item.aspectRatio}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video'
}

// export interface MediaFile {
//   id: string;
//   url: string;
//   filename: string;
//   mimeType: string;
//   aspectRatio?: string;
// }

// 删除文件函数
export const RemoveFiles = (
    setFiles: React.Dispatch<React.SetStateAction<File[]>>, 
    index?: number
  ) => {
    if (index === undefined) {
      setFiles([]);
    } else {
      setFiles(prev => prev.filter((_, i) => i !== index));
    }
};


export const downloadSingleFile = async (
  media: MediaFile | string, 
  mediaType: MediaType = MediaType.IMAGE,
  filename?: string
) => {
  try {
    let url: string;
    let downloadFilename: string;
    let mimeType: string;

    if (typeof media === 'string') {
      // 处理字符串输入（URL或base64）
      if (media.startsWith('data:')) {
        // base64格式
        url = media;
        downloadFilename = filename || `download_${Date.now()}.${mediaType === MediaType.VIDEO ? 'mp4' : 'png'}`;
        mimeType = media.match(/data:([^;]+)/)?.[1] || (mediaType === MediaType.VIDEO ? 'video/mp4' : 'image/png');
      } else {
        // URL格式
        url = media;
        downloadFilename = filename || `download_${Date.now()}.${mediaType === MediaType.VIDEO ? 'mp4' : 'png'}`;
        mimeType = mediaType === MediaType.VIDEO ? 'video/mp4' : 'image/png';
      }
    } else {
      // 处理MediaFile对象
      url = media.url;
      // 确保undefined的名称也被视为空值
      downloadFilename = (media.filename && media.filename !== 'undefined') ? media.filename : `download_${Date.now()}.${mediaType === MediaType.VIDEO ? 'mp4' : 'png'}`;
      mimeType = media.mimeType || (mediaType === MediaType.VIDEO ? 'video/mp4' : 'image/png');
    }

    if (url.startsWith('data:')) {
      // 对于base64数据，直接创建blob并下载
      const base64Data = url.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = downloadFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } else {
      // 对于URL，通过后端API代理下载，避免CORS问题
      const requestBody = typeof media === 'string' ? 
        { url: media, filename: downloadFilename, mimeType } : 
        { url: media.url, filename: downloadFilename, mimeType: media.mimeType };
        
      const response = await apiFetch('/api/download', {
        method: 'POST',
        data: requestBody,
      });
      
      if (!response.ok || response.status != 200) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.error);
        } catch (error) {
          throw new Error(`通过API下载请求失败: ${response.status}`);
        }
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = downloadFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    }
    
    const mediaTypeName = mediaType === MediaType.VIDEO ? '视频' : '图片';
    console.log(`${mediaTypeName}下载成功:`, downloadFilename);
  } catch (error) {
    const mediaTypeName = mediaType === MediaType.VIDEO ? '视频' : '图片';
    console.error(`${mediaTypeName}下载失败:`, error);
    alert(`下载失败: ${typeof media === 'string' ? (filename || 'media') : (media.filename && media.filename !== 'undefined' ? media.filename : 'media')}`);
  }
};

// 批量下载
export const downloadAllFiles = async (
  mediaFiles: (MediaFile | string)[], 
  mediaType: MediaType = MediaType.IMAGE,
  delayMs: number = 500,
  filenamePrefix?: string
) => {
  for (let i = 0; i < mediaFiles.length; i++) {
    const media = mediaFiles[i];
    try {
      // 如果是字符串且没有提供文件名，则使用索引作为文件名的一部分
      const filename = typeof media === 'string' 
        ? `${filenamePrefix || 'download'}_${i + 1}.${mediaType === MediaType.VIDEO ? 'mp4' : 'png'}`
        : undefined;
    
      await downloadSingleFile(media, mediaType, filename);
      // 添加延迟避免同时下载太多文件，视频文件通常更大，延迟更长
      const delay = mediaType === MediaType.VIDEO ? Math.max(delayMs, 1000) : delayMs;
      await new Promise(resolve => setTimeout(resolve, delay));
    } catch (error) {
      const errorFilename = typeof media === 'string' 
        ? `${filenamePrefix || 'download'}_${i + 1}` 
        : (media.filename && media.filename !== 'undefined' ? media.filename : `file_${i + 1}`);
      console.error(`下载 ${errorFilename} 失败:`, error);
    }
  }
};


// 文件上传处理器
export const createFileUploadHandler = (
  setFiles: React.Dispatch<React.SetStateAction<File[]>>,
  options?: {
    maxCount?: number;
    replace?: boolean; // 是否替换而不是追加
    acceptedTypes?: string[]; // 接受的文件类型
  }
) => {
  return (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const maxCount = options?.maxCount || Infinity;
    
    // 如果指定了接受的文件类型，进行过滤
    const filteredFiles = options?.acceptedTypes 
      ? fileList.filter(file => 
          options.acceptedTypes!.some(type => file.type.startsWith(type))
        )
      : fileList;

    setFiles(prev => {
      const newFiles = options?.replace 
        ? filteredFiles 
        : [...prev, ...filteredFiles];
      return newFiles.slice(0, maxCount);
    });

    // 清空input的value，允许重新选择相同文件
    event.target.value = '';
  };
};

// 图片上传处理器
export const createImageUploadHandler = (
  setImages: React.Dispatch<React.SetStateAction<File[]>>,
  options?: {
    maxCount?: number;
    replace?: boolean;
  }
) => {
  return createFileUploadHandler(setImages, {
    ...options,
    acceptedTypes: ['image/']
  });
};

// 专用的视频上传处理器
export const createVideoUploadHandler = (
  setVideos: React.Dispatch<React.SetStateAction<File[]>>,
  options?: {
    maxCount?: number;
    replace?: boolean;
  }
) => {
  return createFileUploadHandler(setVideos, {
    ...options,
    acceptedTypes: ['video/']
  });
};
