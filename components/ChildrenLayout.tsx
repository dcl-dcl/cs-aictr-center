'use client'

import React, { ReactNode } from 'react';

interface CommonLayoutProps {
  // 左侧内容区域 (1.5/6)
  leftContent: ReactNode;
  leftClassName?: string;
  
  // 中间内容区域 (3/6)
  centerContent: ReactNode;
  centerClassName?: string;
  
  // 右侧内容区域 (1.5/6)
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

  // 默认的容器样式，结合现有UI风格
  const defaultContainerClass = `h-full bg-gray-50 p-4 ${getGapClass()}`;
  
  // 默认的面板样式，与现有组件保持一致，添加更好的阴影效果
  const defaultPanelClass = 'bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200';
  
  return (
    <div className={`${defaultContainerClass} ${containerClassName}`}>
      {/* 桌面端：水平布局 */}
      <div className={`hidden lg:flex h-full ${getGapClass()}`}>
        {/* 左侧面板 - 1.5/6 宽度 (25%) */}
        <div className={`${defaultPanelClass} ${leftClassName}`} style={{flex: '1.5'}}>
          <div className="h-full overflow-y-auto">
            {leftContent}
          </div>
          {showDividers && (
            <div className="absolute top-0 right-0 w-px h-full bg-gray-200" />
          )}
        </div>

        {/* 中间面板 - 3/6 宽度 (50%) */}
        <div className={`${defaultPanelClass} ${centerClassName}`} style={{flex: '3'}}>
          <div className="h-full overflow-y-auto">
            {centerContent}
          </div>
          {showDividers && (
            <div className="absolute top-0 right-0 w-px h-full bg-gray-200" />
          )}
        </div>

        {/* 右侧面板 - 1.5/6 宽度 (25%) */}
        <div className={`${defaultPanelClass} ${rightClassName}`} style={{flex: '1.5'}}>
          <div className="h-full overflow-y-auto">
            {rightContent}
          </div>
        </div>
      </div>

      {/* 移动端：垂直布局 */}
      <div className={`lg:hidden flex flex-col h-full ${getGapClass()}`}>
        {/* 左侧面板 */}
        <div className={`flex-shrink-0 ${defaultPanelClass} ${leftClassName}`}>
          <div className="max-h-64 overflow-y-auto">
            {leftContent}
          </div>
        </div>

        {/* 中间面板 */}
        <div className={`flex-1 ${defaultPanelClass} ${centerClassName}`}>
          <div className="h-full overflow-y-auto">
            {centerContent}
          </div>
        </div>

        {/* 右侧面板 */}
        <div className={`flex-shrink-0 ${defaultPanelClass} ${rightClassName}`}>
          <div className="max-h-64 overflow-y-auto">
            {rightContent}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommonLayout;