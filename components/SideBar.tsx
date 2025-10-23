import React, { useState, useEffect, useMemo } from 'react';
import { Menu, Badge } from 'antd';
import type { MenuProps } from 'antd';

interface SubMenuItem {
  id: string;
  label: string;
  path: string;
  icon?: React.ReactNode;
}

interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
  subItems?: SubMenuItem[];
}

interface SidebarProps {
  tabs: TabItem[];
  activeMainMenu?: string;
  activeSubMenu?: string;
  onMainMenuChange?: (tabId: string) => void;
  onSubMenuChange?: (subMenuId: string) => void;
  // 兼容旧版本的prop
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

type MenuItem = Required<MenuProps>['items'][number];

export const Sidebar: React.FC<SidebarProps> = ({
  tabs,
  activeMainMenu,
  activeSubMenu,
  onMainMenuChange,
  onSubMenuChange,
  // 兼容旧版本
  activeTab,
  onTabChange,
}) => {
  // 兼容旧版本的简单侧边栏
  const isSimpleMode = !activeMainMenu && !onMainMenuChange && activeTab && onTabChange;

  // 根据活跃的子菜单找到对应的主菜单
  const findMainMenuForSubMenu = (subMenuId: string) => {
    for (const tab of tabs) {
      if (tab.subItems?.some(subItem => subItem.id === subMenuId)) {
        return tab.id;
      }
    }
    return null;
  };

  // 获取当前选中的菜单项
  const selectedKeys = useMemo(() => {
    if (isSimpleMode) {
      return activeTab ? [activeTab] : [];
    }
    
    if (activeSubMenu) {
      return [activeSubMenu];
    }
    
    if (activeMainMenu) {
      return [activeMainMenu];
    }
    
    return [];
  }, [isSimpleMode, activeTab, activeSubMenu, activeMainMenu]);

  // 获取展开的菜单项
  const openKeys = useMemo(() => {
    const keys: string[] = [];
    
    if (activeMainMenu) {
      keys.push(activeMainMenu);
    }
    
    if (activeSubMenu) {
      const parentMainMenu = findMainMenuForSubMenu(activeSubMenu);
      if (parentMainMenu && !keys.includes(parentMainMenu)) {
        keys.push(parentMainMenu);
      }
    }
    
    return keys;
  }, [activeMainMenu, activeSubMenu]);

  const [currentOpenKeys, setCurrentOpenKeys] = useState<string[]>(openKeys);

  // 监听openKeys变化
  useEffect(() => {
    setCurrentOpenKeys(openKeys);
  }, [openKeys]);

  // 转换tabs数据为Antd Menu所需的items格式
  const menuItems: MenuItem[] = useMemo(() => {
    return tabs.map((tab) => {
      const hasSubItems = tab.subItems && tab.subItems.length > 0;
      
      if (hasSubItems) {
        // 有子菜单的项目
        return {
          key: tab.id,
          icon: tab.icon,
          label: (
            <div className="flex items-center justify-between w-full">
              <span>{tab.label}</span>
              {tab.badge && tab.badge > 0 && (
                <Badge 
                  count="NEW" 
                  size="small"
                  style={{ 
                    backgroundColor: '#f56565',
                    fontSize: '10px',
                    height: '18px',
                    lineHeight: '18px',
                    borderRadius: '9px'
                  }}
                />
              )}
            </div>
          ),
          children: tab.subItems!.map((subItem) => ({
            key: subItem.id,
            icon: subItem.icon,
            label: subItem.label,
          })),
        };
      } else {
        // 没有子菜单的项目
        return {
          key: tab.id,
          icon: tab.icon,
          label: (
            <div className="flex items-center justify-between w-full">
              <span>{tab.label}</span>
              {tab.badge && tab.badge > 0 && (
                <Badge 
                  count="NEW" 
                  size="small"
                  style={{ 
                    backgroundColor: '#f56565',
                    fontSize: '10px',
                    height: '18px',
                    lineHeight: '18px',
                    borderRadius: '9px'
                  }}
                />
              )}
            </div>
          ),
        };
      }
    });
  }, [tabs]);

  // 处理菜单点击
  const handleMenuClick: MenuProps['onClick'] = ({ key, keyPath }) => {
    if (isSimpleMode) {
      onTabChange?.(key);
      return;
    }

    // 检查是否是子菜单项
    const isSubMenuItem = keyPath.length > 1;
    
    if (isSubMenuItem) {
      // 子菜单点击
      onSubMenuChange?.(key);
    } else {
      // 主菜单点击
      const menuItem = tabs.find(tab => tab.id === key);
      if (menuItem?.subItems && menuItem.subItems.length > 0) {
        // 有子菜单的主菜单，不触发页面切换，只展开/收起
        return;
      } else {
        // 没有子菜单的主菜单，触发页面切换
        onMainMenuChange?.(key);
      }
    }
  };

  // 处理子菜单展开/收起
  const handleOpenChange = (keys: string[]) => {
    // 保留所有已打开的菜单，不会在选择新菜单时关闭其他菜单
    const newOpenKeys = [...currentOpenKeys];
    
    // 处理新打开的菜单
    keys.forEach(key => {
      if (!newOpenKeys.includes(key)) {
        newOpenKeys.push(key);
      }
    });
    
    // 处理手动关闭的菜单
    const closedKeys = currentOpenKeys.filter(key => !keys.includes(key));
    closedKeys.forEach(key => {
      const index = newOpenKeys.indexOf(key);
      if (index !== -1) {
        newOpenKeys.splice(index, 1);
      }
    });
    
    setCurrentOpenKeys(newOpenKeys);
  };

  return (
    <div className="w-64 bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col border-r border-gray-200 shadow-2xl shadow-gray-400/60" style={{boxShadow: '20px 0 25px -5px rgba(0, 0, 0, 0.1), 10px 0 10px -5px rgba(0, 0, 0, 0.04)'}}>
      <div className="flex-1 overflow-y-auto py-6">
        <Menu
          mode="inline"
          selectedKeys={selectedKeys}
          openKeys={currentOpenKeys}
          onOpenChange={handleOpenChange}
          onClick={handleMenuClick}
          items={menuItems}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            fontSize: '14px',
          }}
          className="antd-sidebar-menu"
        />
      </div>
    </div>
  );
};
