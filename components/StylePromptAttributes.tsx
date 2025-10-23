'use client'
import { AttributeGroup } from '@/types/BaseType'


interface StyleAttributesProps {
  title?: string;
  titleColor?: string;
  attributeGroups: AttributeGroup[];
  selectedAttributes?: Record<string, string | string[]>;
  onAttributeChange?: (groupId: string, value: string | string[]) => void;
}

export const StyleAttributesSelector: React.FC<StyleAttributesProps> = ({
  title = "图像提示属性",
  titleColor = "text-blue-500",
  attributeGroups,
  selectedAttributes = {},
  onAttributeChange
}) => {
  const handleAttributeClick = (groupId: string, value: string) => {
    if (!onAttributeChange) return;
    
    const currentValue = selectedAttributes[groupId];
    if (Array.isArray(currentValue)) {
      // 多选模式
      const newValue = currentValue.includes(value)
        ? currentValue.filter(v => v !== value)
        : [...currentValue, value];
      onAttributeChange(groupId, newValue);
    } else {
      // 单选模式 - 支持点击已选择的标签来取消选择
      const newValue = currentValue === value ? '' : value;
      onAttributeChange(groupId, newValue);
    }
  };

  const isSelected = (groupId: string, value: string) => {
    const currentValue = selectedAttributes[groupId];
    if (Array.isArray(currentValue)) {
      return currentValue.includes(value);
    }
    return currentValue === value;
  };

  const renderAttributeGroup = (group: AttributeGroup, columnClass: string = "") => {
    if (group.type === 'select') {
      return (
        <div key={group.id} className={columnClass}>
          <label className="block text-base font-medium text-gray-700 mb-3">
            {group.label} {group.required && '*'}
          </label>
          <select 
            className="w-full border text-black border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={selectedAttributes[group.id] as string || ''}
            onChange={(e) => onAttributeChange?.(group.id, e.target.value)}
          >
            <option value="">-- 请选择 --</option>
            {group.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <div key={group.id} className={columnClass}>
        <label className="block text-base font-medium text-gray-700 mb-3">
          {group.label} {group.required && '*'}
        </label>
        <div className="flex flex-wrap gap-3">
          {group.options.map((option) => (
            <button 
              key={option.value}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 transform hover:scale-105 ${
                isSelected(group.id, option.value)
                  ? 'bg-blue-500 text-white border-blue-500 shadow-lg'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:shadow-md'
              }`}
              onClick={() => handleAttributeClick(group.id, option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // 过滤显示的属性组（根据父子关系）
  const getVisibleGroups = () => {
    return attributeGroups.filter(group => {
      // 如果没有父级依赖，直接显示
      if (!group.parent || !group.parentValue) {
        return true;
      }
      // 如果有父级依赖，检查父级是否选中了对应的值
      return selectedAttributes[group.parent] === group.parentValue;
    });
  };
  
  const visibleGroups = getVisibleGroups();
  
  // 将可见的属性组分为两列
  const leftColumnGroups = visibleGroups.filter((_, index) => index % 2 === 0);
  const rightColumnGroups = visibleGroups.filter((_, index) => index % 2 === 1);

  return (
    <div className="mt-8">
      <div className="flex items-center mb-6">
        <span className={`${titleColor} mr-2`}>●</span>
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-2 gap-8">
          {/* 左列 */}
          <div className="space-y-4">
            {leftColumnGroups.map((group) => renderAttributeGroup(group))}
          </div>
          
          {/* 右列 */}
          <div className="space-y-4">
            {rightColumnGroups.map((group) => renderAttributeGroup(group))}
          </div>
        </div>
      </div>
    </div>
  );
};
