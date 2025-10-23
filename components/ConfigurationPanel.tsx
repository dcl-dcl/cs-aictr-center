'use client'
import React, { useEffect } from 'react';
import { Switch } from 'antd';

interface ConfigOption {
  value: any;
  label: string;
}

interface ConfigItem {
  id: string;
  label: string;
  defaultValue: any;
  options: ConfigOption[];
}

interface ConfigurationPanelProps {
  title?: string;
  titleColor?: string;
  configSelections: Record<string, any>;
  configs: ConfigItem[];
  onConfigChange: (configId: string, value: any) => void;
  // 可选：每行显示的配置数量（1或2），默认2
  itemsPerRow?: 1 | 2;
}

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  title = "设置",
  titleColor = "text-purple-500",
  configSelections,
  configs,
  onConfigChange,
  itemsPerRow = 2
}) => {
  // 配置变更时自动保存到本地存储
  useEffect(() => {
    if (Object.keys(configSelections).length > 0) {
      localStorage.setItem('modelConfigSelections', JSON.stringify(configSelections));
    }
  }, [configSelections]);

  // 组件挂载时恢复配置
  useEffect(() => {
    const savedSelections = localStorage.getItem('modelConfigSelections');
    if (savedSelections && Object.keys(configSelections).length === 0) {
      try {
        const parsed = JSON.parse(savedSelections);
        Object.entries(parsed).forEach(([key, value]) => {
          if (configs.find(config => config.id === key)) {
            onConfigChange(key, value);
          }
        });
      } catch (error) {
        console.error('恢复配置选择失败:', error);
      }
    }
  }, [configs, configSelections, onConfigChange]);
  if (Object.keys(configSelections).length === 0) {
    return null;
  }

  const getAspectRatioIcon = (ratio: string) => {
    const ratioMap: {[key: string]: {width: number, height: number}} = {
      '1:1': {width: 20, height: 20},
      '3:2': {width: 24, height: 16},
      '2:3': {width: 16, height: 24},
      '4:3': {width: 24, height: 18},
      '3:4': {width: 18, height: 24},
      '4:5': {width: 20, height: 25},
      '5:4': {width: 25, height: 20},
      '9:16': {width: 18, height: 32},
      '16:9': {width: 32, height: 18},
      '21:9': {width: 42, height: 18}
    };
    
    const dimensions = ratioMap[ratio] || {width: 20, height: 20};
    
    return (
      <div 
        className="border-2 border-gray-400 bg-gray-200"
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`
        }}
      />
    );
  };

  return (
    <>
      <div className="flex items-center mb-6">
        <span className={`${titleColor} mr-2 text-lg`}>●</span>
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* 自适应两列网格布局 */}
        <div className={`grid ${itemsPerRow === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-4 auto-rows-min`}>
          {configs.map((config) => {
            const currentValue = configSelections[config.id] ?? config.defaultValue;
            
            // 文件尺寸使用图标
            if (config.id === 'aspectRatio') {
              return (
                <div key={config.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100 transition-all duration-200 hover:bg-gray-100">
                  <label className="block text-base font-semibold text-gray-800 mb-4">{config.label}</label>
                  <div className={`grid ${itemsPerRow === 1 ? 'grid-cols-10' : 'grid-cols-4 sm:grid-cols-5'} gap-3`}>
                    {config.options.map((option) => (
                      <button
                        key={option.value}
                        className={`flex flex-col items-center justify-center gap-0.5 p-1 rounded border transition-all duration-200 aspect-square transform hover:scale-105 ${
                          currentValue === option.value
                            ? 'bg-blue-500 border-blue-500 text-white shadow-lg'
                            : 'bg-white border-gray-300 hover:border-blue-400 hover:shadow-md'
                        }`}
                        onClick={() => onConfigChange(config.id, option.value)}
                      >
                        <div className="flex items-center justify-center mb-1">
                          {getAspectRatioIcon(option.value)}
                        </div>
                        <span className={`text-xs font-medium text-center ${
                          currentValue === option.value ? 'text-white' : 'text-gray-700'
                        }`}>{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            }
            
            // 布尔类型使用开关
            if (typeof config.defaultValue === 'boolean') {
              return (
                <div key={config.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100 transition-all duration-200 hover:bg-gray-100">
                  <div className="flex items-center justify-between">
                    <label className="text-base font-semibold text-gray-800">{config.label}</label>
                    <Switch 
                      size="default" 
                      checked={currentValue}
                      onChange={(checked) => onConfigChange(config.id, checked)}
                      className="ml-4"
                    />
                  </div>
                </div>
              );
            }
            
            // 选项少于等于4个使用按钮组
            if (config.options.length <= 4) {
              return (
                <div key={config.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100 transition-all duration-200 hover:bg-gray-100">
                  <label className="block text-base font-semibold text-gray-800 mb-4">{config.label}</label>
                  <div className="flex flex-wrap gap-3">
                    {config.options.map((option) => (
                      <button
                        key={option.value}
                        className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 transform hover:scale-105 ${
                          currentValue === option.value
                            ? 'bg-blue-500 text-white border-blue-500 shadow-lg'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:shadow-md'
                        }`}
                        onClick={() => onConfigChange(config.id, option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            }
            
            // 其他类型使用下拉框
            return (
              <div key={config.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100 transition-all duration-200 hover:bg-gray-100">
                <label className="block text-base font-semibold text-gray-800 mb-4">{config.label}</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white hover:border-blue-400"
                  value={currentValue}
                  onChange={(e) => {
                    const value = config.options.find(opt => opt.value.toString() === e.target.value)?.value;
                    onConfigChange(config.id, value);
                  }}
                >
                  {config.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};


// export const ConfigurationPanelBak: React.FC<ConfigurationPanelProps> = ({
//   title = "设置",
//   titleColor = "text-purple-500",
//   configSelections,
//   configs,
//   onConfigChange
// }) => {
//   // 配置变更时自动保存到本地存储
//   useEffect(() => {
//     if (Object.keys(configSelections).length > 0) {
//       localStorage.setItem('modelConfigSelections', JSON.stringify(configSelections));
//     }
//   }, [configSelections]);

//   // 组件挂载时恢复配置
//   useEffect(() => {
//     const savedSelections = localStorage.getItem('modelConfigSelections');
//     if (savedSelections && Object.keys(configSelections).length === 0) {
//       try {
//         const parsed = JSON.parse(savedSelections);
//         Object.entries(parsed).forEach(([key, value]) => {
//           if (configs.find(config => config.id === key)) {
//             onConfigChange(key, value);
//           }
//         });
//       } catch (error) {
//         console.error('恢复配置选择失败:', error);
//       }
//     }
//   }, [configs, configSelections, onConfigChange]);
//   if (Object.keys(configSelections).length === 0) {
//     return null;
//   }

//   const getAspectRatioIcon = (ratio: string) => {
//     // 解析比例字符串，例如 "21:9" => [21, 9]
//     const [w, h] = ratio.split(':').map(Number);
    
//     // 设置基准尺寸
//     const baseWidth = 40;  // 基准宽度
//     const baseHeight = 30; // 基准高度
    
//     // 计算目标宽高比
//     const targetRatio = w / h;
    
//     // 根据目标宽高比计算实际尺寸
//     let width: number;
//     let height: number;
    
//     if (targetRatio > baseWidth / baseHeight) {
//       // 如果目标比例更宽，以基准宽度为准
//       width = baseWidth;
//       height = baseWidth / targetRatio;
//     } else {
//       // 如果目标比例更高，以基准高度为准
//       height = baseHeight;
//       width = baseHeight * targetRatio;
//     }
    
//     return (
//       <div 
//         className="border-2 border-gray-400 bg-gray-200"
//         style={{
//           width: `${Math.round(width)}px`,
//           height: `${Math.round(height)}px`
//         }}
//       />
//     );
//   };

//   return (
//     <>
//       <div className="flex items-center mb-6">
//         <span className={`${titleColor} mr-2`}>●</span>
//         <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
//       </div>
//       <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 focus:ring-blue-500">
//         <div className="space-y-6">
//           {configs.map((config) => {
//             const currentValue = configSelections[config.id] ?? config.defaultValue;
            
//             // 文件尺寸使用图标
//             if (config.id === 'aspectRatio') {
//               return (
//                 <div key={config.id}>
//                   <label className="block text-base font-medium text-gray-700 mb-3">{config.label}</label>
//                   <div className="flex flex-wrap gap-6">
//                     {config.options.map((option) => (
//                       <button
//                         key={option.value}
//                         className={`flex flex-col items-center justify-between gap-2 p-3 rounded-lg border transition-colors w-20 h-20 ${
//                           currentValue === option.value
//                             ? 'bg-blue-500 border-blue-500 text-white'
//                             : 'bg-white border-gray-300 hover:border-blue-300'
//                         }`}
//                         onClick={() => onConfigChange(config.id, option.value)}
//                       >
//                         <div className="flex-1 flex items-center justify-center">
//                           {getAspectRatioIcon(option.value)}
//                         </div>
//                         <span className="text-xs font-medium text-center text-gray-700">{option.label}</span>
//                       </button>
//                     ))}
//                   </div>
//                 </div>
//               );
//             }
            
//             // 布尔类型使用开关
//             if (typeof config.defaultValue === 'boolean') {
//               return (
//                 <div key={config.id} className="flex items-center gap-3 py-2">
//                   <Switch 
//                     size="default" 
//                     checked={currentValue}
//                     onChange={(checked) => onConfigChange(config.id, checked)}
//                   />
//                   <label className="text-base font-medium text-gray-700">{config.label}</label>
//                 </div>
//               );
//             }
            
//             // 选项少于等于4个使用按钮组
//             if (config.options.length <= 4) {
//               return (
//                 <div key={config.id} className="py-2">
//                   <label className="block text-base font-medium text-gray-700 mb-4">{config.label}</label>
//                   <div className="flex flex-wrap gap-3">
//                     {config.options.map((option) => (
//                       <button
//                         key={option.value}
//                         className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
//                           currentValue === option.value
//                             ? 'bg-blue-500 text-white border-blue-500'
//                             : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300'
//                         }`}
//                         onClick={() => onConfigChange(config.id, option.value)}
//                       >
//                         {option.label}
//                       </button>
//                     ))}
//                   </div>
//                 </div>
//               );
//             }
            
//             // 其他类型使用下拉框
//             return (
//               <div key={config.id} className="py-2">
//                 <label className="block text-base font-medium text-gray-700 mb-3">{config.label}</label>
//                 <select 
//                   className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   value={currentValue}
//                   onChange={(e) => {
//                     const value = config.options.find(opt => opt.value.toString() === e.target.value)?.value;
//                     onConfigChange(config.id, value);
//                   }}
//                 >
//                   {config.options.map((option) => (
//                     <option key={option.value} value={option.value}>
//                       {option.label}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             );
//           })}
//         </div>
//       </div>
//     </>
//   );
// };