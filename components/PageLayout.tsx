'use client'

import React, { ReactNode } from 'react';

interface CommonLayoutProps {
  // 左侧内容区域 (1/3)
  leftContent: ReactNode;
  leftClassName?: string;
  
  // 中间内容区域 (1/3)
  centerContent: ReactNode;
  centerClassName?: string;
  
  // 右侧内容区域 (1/3)
  rightContent: ReactNode;
  rightClassName?: string;
  
  // 整体容器样式
  containerClassName?: string;
  
  // 是否显示分隔线
  showDividers?: boolean;
  
  // 间距大小
  gap?: 'sm' | 'md' | 'lg';
}

const CommonLayout: React.FC<CommonLayoutProps> = ({
  leftContent,
  leftClassName = '',
  centerContent,
  centerClassName = '',
  rightContent,
  rightClassName = '',
  containerClassName = '',
  showDividers = false,
  gap = 'md'
}) => {
  // 根据gap参数设置间距
  const getGapClass = () => {
    switch (gap) {
      case 'sm': return 'gap-2';
      case 'md': return 'gap-4';
      case 'lg': return 'gap-6';
      default: return 'gap-4';
    }
  };

  // 默认的容器样式，增加更好的间距和响应式设计
  const defaultContainerClass = `h-full bg-gray-50 p-4 ${getGapClass()}`;
  
  // 默认的面板样式，增加内边距，防止内容过于紧密
  const defaultPanelClass = 'bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 min-w-0';
  
  return (
    <div className={`${defaultContainerClass} ${containerClassName}`}>
      {/* 桌面端：水平布局 */}
      <div className={`hidden lg:flex h-full ${getGapClass()}`}>
        {/* 左侧面板 - 1/3 宽度 (33.33%) */}
        <div className={`${defaultPanelClass} ${leftClassName}`} style={{flex: '1'}}>
          <div className="h-full overflow-y-auto overflow-x-hidden p-4">
            {leftContent}
          </div>
          {showDividers && (
            <div className="absolute top-0 right-0 w-px h-full bg-gray-200" />
          )}
        </div>

        {/* 中间面板 - 1/3 宽度 (33.33%) */}
        <div className={`${defaultPanelClass} ${centerClassName}`} style={{flex: '1'}}>
          <div className="h-full overflow-y-auto overflow-x-hidden p-4">
            {centerContent}
          </div>
          {showDividers && (
            <div className="absolute top-0 right-0 w-px h-full bg-gray-200" />
          )}
        </div>

        {/* 右侧面板 - 1/3 宽度 (33.33%) */}
        <div className={`${defaultPanelClass} ${rightClassName}`} style={{flex: '1'}}>
          <div className="h-full overflow-y-auto overflow-x-hidden p-4">
            {rightContent}
          </div>
        </div>
      </div>

      {/* 移动端：垂直布局 */}
      <div className={`lg:hidden flex flex-col h-full ${getGapClass()}`}>
        {/* 左侧面板 */}
        <div className={`flex-shrink-0 ${defaultPanelClass} ${leftClassName}`}>
          <div className="max-h-64 overflow-y-auto overflow-x-hidden p-4">
            {leftContent}
          </div>
        </div>

        {/* 中间面板 */}
        <div className={`flex-1 ${defaultPanelClass} ${centerClassName}`}>
          <div className="h-full overflow-y-auto overflow-x-hidden p-4">
            {centerContent}
          </div>
        </div>

        {/* 右侧面板 */}
        <div className={`flex-shrink-0 ${defaultPanelClass} ${rightClassName}`}>
          <div className="max-h-64 overflow-y-auto overflow-x-hidden p-4">
            {rightContent}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommonLayout;