import { FC, SVGProps } from 'react';

// 添加加载动画组件
export const LoadingSpinner: FC = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


export const ImageGenerateResultIcon: FC<{
  primaryText?: string;
  secondaryText?: string;
}> = ({ 
  primaryText = "生成的图像将在这里显示", 
  secondaryText = "请输入提示词并点击生成按钮开始创作" 
}) => (
  <>
  <svg className="w-20 h-20 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
  <p className="text-center text-base font-medium text-gray-500 mb-2">{primaryText}</p>
  <p className="text-center text-sm text-gray-400">{secondaryText}</p>
  </>
);

export const VideoGenerateResultIcon: FC<{
  primaryText?: string;
  secondaryText?: string;
}> = ({ 
  primaryText = "生成的视频将在这里显示", 
  secondaryText = "请输入提示词并点击生成按钮开始创作" 
}) => (
  <>
  <svg className="w-20 h-20 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
  <p className="text-center text-base font-medium text-gray-500 mb-2">{primaryText}</p>
  <p className="text-center text-sm text-gray-400">{secondaryText}</p>
  </>
);


export const UploadIcon = ({ primaryLabel, subLabel }: { primaryLabel: string, subLabel: string }) => (
  <div className="flex flex-col items-center">
      <svg className="w-12 h-12 text-blue-500 mb-3" fill="#3B82F6" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg">
          <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
          <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
          <g id="SVGRepo_iconCarrier">
              <path d="M30 2.497h-28c-1.099 0-2 0.901-2 2v23.006c0 1.099 0.9 2 2 2h28c1.099 0 2-0.901 2-2v-23.006c0-1.099-0.901-2-2-2zM30 27.503l-28-0v-5.892l8.027-7.779 8.275 8.265c0.341 0.414 0.948 0.361 1.379 0.035l3.652-3.306 6.587 6.762c0.025 0.025 0.053 0.044 0.080 0.065v1.85zM30 22.806l-5.876-6.013c-0.357-0.352-0.915-0.387-1.311-0.086l-3.768 3.282-8.28-8.19c-0.177-0.214-0.432-0.344-0.709-0.363-0.275-0.010-0.547 0.080-0.749 0.27l-7.309 7.112v-14.322h28v18.309zM23 12.504c1.102 0 1.995-0.894 1.995-1.995s-0.892-1.995-1.995-1.995-1.995 0.894-1.995 1.995c0 1.101 0.892 1.995 1.995 1.995z"></path> 
              </g>
      </svg>
      <p className="text-gray-700 mb-1 font-semibold">{primaryLabel}</p>
      <p className="text-sm text-gray-500">{subLabel}</p>
  </div>
);