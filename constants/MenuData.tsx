import React from 'react';
import type { MenuProps } from 'antd';

// Ant Design Menu Item 类型
type MenuItem = Required<MenuProps>['items'][number];

// 扩展的菜单项接口，包含路径信息
interface ExtendedMenuItem {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  children?: ExtendedMenuItem[];
  path?: string;
  type?: 'group' | 'divider';
}

// 导航项接口
interface FeatureItem {
  id: string;
  name: string;
  path: string;
  icon: string;
  description?: string;
  status?: 'available' | 'coming-soon';
}

// 菜单映射接口
interface MenuMappings {
  pathToMenu: Record<string, { mainMenu: string; subMenu: string }>;
  menuKeyToPath: Record<string, string>;
  keyToLabel: Record<string, string>;
}

// Ant Design Menu 数据格式
export const menuItems: ExtendedMenuItem[] = [
  {
    key: 'ai-tryon',
    label: 'AI 试穿',
    icon: (
      <svg className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 4C14 4 15.5 2.5 16 1H8C8.5 2.5 10 4 12 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M20 8H4C4 8 3 9.2 3 10V12H21V10C21 9.2 20 8 20 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M21 12H3V18C3 19.7 4.3 21 6 21H18C19.7 21 21 19.7 21 18V12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    path: '/tryon?tab=tryon',
    children: [
      {
        key: 'tryon',
        label: '模特图试穿',
        path: '/tryon?tab=tryon',
        icon: (
          <svg className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4.5C13.6569 4.5 15 3.15685 15 1.5H9C9 3.15685 10.3431 4.5 12 4.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M17.5 22.5H6.5C5.11929 22.5 4 21.3807 4 20V11.5C4 10.1193 5.11929 9 6.5 9H17.5C18.8807 9 20 10.1193 20 11.5V20C20 21.3807 18.8807 22.5 17.5 22.5Z" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M12 9V22.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M9 15H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        )
      },
      {
        key: 'product-recontext',
        label: '商品图提示试穿',
        path: '/tryon?tab=product-recontext',
        icon: (
          <svg className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L8 4L12 6L16 4L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 4V10L12 12L16 10V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5 14.5V8.5L2 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M19 14.5V8.5L22 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5 14.5L12 17.5L19 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 17.5V22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )
      }
    ]
  },

  {
    key: 'ai-image',
    label: 'AI 图片',
    icon: (
      <svg className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="8.5" cy="8.5" r="2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    path: '/imagen?tab=gemini-generation',
    children: [
      {
        key: 'nano-banana',
        label: 'Nano Banana',
        path: '/imagen?tab=gemini-generation',
        icon: (
          <svg className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" width="800px" height="800px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22 6.5C22 3.21 20.86 1 19.166 1c-1.572 0-1.837 1.553-2.118 3.196a10.67 10.67 0 0 1-1.404 4.25 4.722 4.722 0 0 0-3.403-1.418 6.499 6.499 0 0 0-4.877 1.696A5.317 5.317 0 0 0 6 12.567v.933l.884.32A8.074 8.074 0 0 1 13.5 11l.212.003A17.99 17.99 0 0 1 4.506 16H3v2.98l1.434.06A13.236 13.236 0 0 0 9.5 20a11.778 11.778 0 0 0 7.19-2.47 18.22 18.22 0 0 1-1.613 4.46l.3.729a1.677 1.677 0 0 0 .452.058c1.924 0 5.108-2.999 5.108-6.417a5.695 5.695 0 0 0-.823-2.898A13.38 13.38 0 0 0 22 6.5zm-3.966-2.135C18.327 2.648 18.5 2 19.166 2 20.229 2 21 3.893 21 6.5a12.513 12.513 0 0 1-1.516 6.06 6.155 6.155 0 0 0-1.868-1.595l-.57-.419a6.435 6.435 0 0 0-.735-1.316 11.048 11.048 0 0 0 1.723-4.865zM6.996 12.261a4.215 4.215 0 0 1 1.089-2.844 5.562 5.562 0 0 1 4.156-1.389 4.042 4.042 0 0 1 3.477 2.086A17.894 17.894 0 0 0 13.5 10a9.252 9.252 0 0 0-6.504 2.26zM4 18.02v-1.024l.59-.004c.123-.02.248-.057.373-.082l-.024 1.244c-.065-.026-.136-.045-.2-.072zm5.5.98a12.827 12.827 0 0 1-3.568-.5l.008-.425c.266.009.486.01.635.01 3.94 0 7.282-1.195 9.415-3.367l-.714-.701c-1.942 1.98-5.032 3.069-8.7 3.069-.145 0-.358-.002-.617-.011l.007-.383a19.767 19.767 0 0 0 9.091-5.636 10.853 10.853 0 0 1 1.22.166l.652.48a14.038 14.038 0 0 1 .18 2.211 15.686 15.686 0 0 1-.148 2.107A10.917 10.917 0 0 1 9.5 19zm6.851 2.679a19.103 19.103 0 0 0 1.759-7.766c0-.483-.023-.964-.066-1.424a5.259 5.259 0 0 1 1.893 3.871 6.213 6.213 0 0 1-3.586 5.319z"/><path fill="none" d="M0 0h24v24H0z"/></svg>
        )
      },
      {
        key: 'imagen',
        label: 'Imagen Model',
        path: '/imagen?tab=imagen-generation',
        icon: (
          <svg
            className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32" enableBackground="new 0 0 32 32"><rect x="13" y="23" fill="none" stroke="#000000" strokeWidth="2" strokeMiterlimit="10" width="6" height="4"/><path fill="none" stroke="#000000" strokeWidth="2" strokeMiterlimit="10" d="M24,12c0-4.7-4.1-8.5-8.9-7.9
          c-3.6,0.4-6.5,3.3-7,6.9c-0.4,2.9,0.8,5.5,2.8,7.2c1.4,1.2,2.2,2.9,2.2,4.6V23h6v-0.2c0-1.8,0.9-3.5,2.3-4.8
          C22.9,16.5,24,14.4,24,12z"/><line fill="none" stroke="#000000" strokeWidth="2" strokeMiterlimit="10" x1="27" y1="13" x2="30" y2="13"/><line fill="none" stroke="#000000" strokeWidth="2" strokeMiterlimit="10" x1="2" y1="13" x2="5" y2="13"/><line fill="none" stroke="#000000" strokeWidth="2" strokeMiterlimit="10" x1="23.8" y1="20.8" x2="25.9" y2="22.9"/><line fill="none" stroke="#000000" strokeWidth="2" strokeMiterlimit="10" x1="6.1" y1="3.1" x2="8.2" y2="5.2"/><line fill="none" stroke="#000000" strokeWidth="2" strokeMiterlimit="10" x1="8.2" y1="20.8" x2="6.1" y2="22.9"/><line fill="none" stroke="#000000" strokeWidth="2" strokeMiterlimit="10" x1="25.9" y1="3.1" x2="23.8" y2="5.2"/><path d="M18,27c0,1.1-0.9,2-2,2s-2-0.9-2-2H18z"/>
        </svg>
        )
      },
      {
        key: 'image-goods',
        label: '电商创意',
        path: '/imagen/goods',
        icon: (
          <svg className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" width="800px" height="800px" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path fill="#000000" d="M320 288v-22.336C320 154.688 405.504 64 512 64s192 90.688 192 201.664v22.4h131.072a32 32 0 0131.808 28.8l57.6 576a32 32 0 01-31.808 35.2H131.328a32 32 0 01-31.808-35.2l57.6-576a32 32 0 0131.808-28.8H320zm64 0h256v-22.336C640 189.248 582.272 128 512 128c-70.272 0-128 61.248-128 137.664v22.4zm-64 64H217.92l-51.2 512h690.56l-51.264-512H704v96a32 32 0 11-64 0v-96H384v96a32 32 0 01-64 0v-96z"/></svg>
        )
      }
    ]
  },

  {
    key: 'ai-video',
    label: 'AI 视频',
    icon: (
      <svg className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M18 10L22 8V16L18 14V10Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M6 8H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M6 12H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M6 16H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    path: '/veo',
    children: [
      {
        key: 'veo',
        label: 'Veo视频',
        path: '/veo',
        icon: (
          <svg className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="6" width="15" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M17 10L22 8V16L17 14V10Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M5.5 10H8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M5.5 14H8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        )
      }
    ]
  }
];

// 应用功能卡片
export const appFeatures: FeatureItem[] = [
  {
    id: 'tryon',
    name: '虚拟试穿',
    path: '/tryon?tab=tryon',
    icon: '👚',
    description: '上传照片，AI 虚拟试穿，一键生成试穿效果',
    status: 'available'
  },
  {
    id: 'imagen',
    name: '图片生成',
    path: '/imagen?tab=gemini-generation',
    icon: '🖼️',
    description: '基于文本描述生成高质量图片',
    status: 'available'
  },
  {
    id: 'veo',
    name: '视频生成',
    path: '/veo',
    icon: '📽️',
    description: '智能视频生成工具',
    status: 'available'
  }
];

// 导航项配置 - 只保留首页按钮
export const navItems: FeatureItem[] = [
  { id: 'home', name: '首页', path: '/', icon: '🏠' }
];

// 功能卡片配置 - 包含所有功能，包括开发中的功能
export const featureCards: FeatureItem[] = [
  ...appFeatures,
  {
    id: 'more',
    name: '更多功能开发中',
    path: '#',
    icon: '🚧',
    description: '我们正在开发更多创新功能',
    status: 'coming-soon'
  }
];



// 生成菜单映射数据
export const menuMappings: MenuMappings = (() => {
  const pathToMenu: Record<string, { mainMenu: string; subMenu: string }> = {};
  const menuKeyToPath: Record<string, string> = {};
  const keyToLabel: Record<string, string> = {};

  // 递归处理菜单项
  const processMenuItem = (item: ExtendedMenuItem, parentKey?: string) => {
    // 记录key到路径的映射
    if (item.path) {
      menuKeyToPath[item.key] = item.path;
      
      // 处理带查询参数的路径
      const basePath = item.path.split('?')[0];
      if (parentKey) {
        pathToMenu[basePath] = { 
          mainMenu: parentKey, 
          subMenu: item.key 
        };
        pathToMenu[item.path] = { 
          mainMenu: parentKey, 
          subMenu: item.key 
        };
      } else {
        pathToMenu[basePath] = { 
          mainMenu: item.key, 
          subMenu: '' 
        };
        pathToMenu[item.path] = { 
          mainMenu: item.key, 
          subMenu: '' 
        };
      }
    }
    
    // 记录key到标签的映射
    keyToLabel[item.key] = typeof item.label === 'string' ? item.label : item.key;
    
    // 处理子菜单
    if (item.children) {
      item.children.forEach(child => processMenuItem(child, item.key));
    }
  };

  menuItems.forEach(item => processMenuItem(item));

  return {
    pathToMenu,
    menuKeyToPath,
    keyToLabel
  };
})();

// 根据路径获取当前激活的菜单项
export const getActiveMenuFromPath = (pathname: string, searchParams: URLSearchParams): { mainMenu: string; subMenu: string } => {
  const result = { mainMenu: '', subMenu: '' };
  
  // 如果是首页，直接返回空结果
  if (pathname === '/') {
    return result;
  }
  
  // 先尝试直接匹配完整路径（包含查询参数）
  const fullPath = searchParams.size ? pathname + '?' + searchParams.toString() : pathname;
  let exactMatch = menuMappings.pathToMenu[fullPath];
  
  // 如果没有完全匹配，尝试匹配基础路径
  if (!exactMatch) {
    exactMatch = menuMappings.pathToMenu[pathname];
  }
  
  if (exactMatch) {
    return {
      mainMenu: exactMatch.mainMenu,
      subMenu: exactMatch.subMenu
    };
  }
  
  return result;
};