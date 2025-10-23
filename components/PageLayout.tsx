import React, { ReactNode } from 'react';

interface PageLayoutProps {
  // 页面背景样式
  backgroundClassName?: string;
  
  // 左侧内容区域
  leftContent: ReactNode;
  leftClassName?: string;
  
  // 右侧内容区域
  rightContent: ReactNode;
  rightClassName?: string;
  
  // 主内容区域样式
  mainClassName?: string;
  
  // 是否使用响应式布局（tryon页面需要）
  responsive?: boolean;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  backgroundClassName = "h-full bg-gray-50",
  leftContent,
  leftClassName,
  rightContent,
  rightClassName,
  mainClassName = "flex-1 flex gap-6 p-4",
  responsive = false
}) => {
  // // 根据是否响应式设置不同的样式
  // const getLeftContainerClass = () => {
  //   if (responsive) {
  //     return `w-full lg:w-1/2 bg-white rounded-xl shadow-lg border border-gray-200 max-h-screen overflow-hidden flex flex-col ${leftClassName || ''}`;
  //   }
  //   return `w-1/2 bg-white rounded-lg shadow-sm max-h-screen overflow-y-auto ${leftClassName || ''}`;
  // };

  // const getRightContainerClass = () => {
  //   if (responsive) {
  //     return `w-full lg:w-1/2 p-6 lg:p-8 bg-white rounded-xl shadow-lg border border-gray-200 max-h-screen overflow-y-auto ${rightClassName || ''}`;
  //   }
  //   return `w-1/2 p-4 lg:p-8 bg-white rounded-lg shadow-sm max-h-screen overflow-y-auto ${rightClassName || ''}`;
  // };

  // const getMainContainerClass = () => {
  //   if (responsive) {
  //     return "flex-1 flex gap-6 p-4";
  //   }
  //   return mainClassName;
  // };

  // return (
  //   <div className={backgroundClassName}>
  //     <main className="flex flex-row h-full">
  //       {/* 主内容区域 */}
  //       <div className={getMainContainerClass()}>
  //         {/* 左侧输入区域 */}
  //         <div className={getLeftContainerClass()}>
  //           {responsive ? (
  //             <div className="flex-1 overflow-y-auto">
  //               <div className="p-6 lg:p-8">
  //                 {leftContent}
  //               </div>
  //             </div>
  //           ) : (
  //             <div className="p-8">
  //               {leftContent}
  //             </div>
  //           )}
  //         </div>

  //         {/* 右侧结果展示区域 */}
  //         <div className={getRightContainerClass()}>
  //           {rightContent}
  //         </div>
  //       </div>
  //     </main>
  //   </div>
  // );
  return (
        <div className="h-full bg-gray-50">
          <div className="flex flex-row h-full">
              {/* 主内容区域 */}
              <div className="flex-1 flex gap-6 p-4">
                  {/* 左侧输入区域 */}
                  <div className="w-1/2 bg-white rounded-lg shadow-sm max-h-screen overflow-y-auto">
                      <div className="p-8">
                          {leftContent}
                      </div>
                  </div>

                  {/* 右侧结果展示区域 */}
                  <div className="w-1/2 p-4 lg:p-8 bg-white rounded-lg shadow-sm max-h-screen overflow-y-auto">
                      {rightContent}
                  </div>
              </div>
          </div>
      </div>
  );
};

export default PageLayout;