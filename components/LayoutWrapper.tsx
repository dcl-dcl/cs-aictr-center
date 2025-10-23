'use client'

import { Menu } from 'antd';
import useMenuState from '@/hooks/useMenuState';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

const LayoutWrapper: React.FC<LayoutWrapperProps> = ({ children }) => {
  // 使用自定义hook管理菜单状态
  const { showSidebar, selectedKeys, openKeys, menuItems, handleMenuClick } = useMenuState();

  if (!showSidebar) {
    // 首页不显示侧边栏
    return (
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    );
  }

  return (
    <main className="flex-1 flex overflow-hidden">
      {/* 侧边栏 - 直接使用Antd Menu组件 */}
      <div className="w-64 bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col border-r border-gray-200 shadow-2xl shadow-gray-400/60" 
           style={{boxShadow: '20px 0 25px -5px rgba(0, 0, 0, 0.1), 10px 0 10px -5px rgba(0, 0, 0, 0.04)'}}>
        <div className="flex-1 overflow-y-auto py-6">
          <Menu
            mode="inline"
            selectedKeys={selectedKeys}
            defaultOpenKeys={openKeys}
            onClick={handleMenuClick}
            items={menuItems as any}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '14px',
            }}
            className="antd-sidebar-menu"
          />
        </div>
      </div>
      
      {/* 主内容区域 */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </main>
  );
};

export default LayoutWrapper;