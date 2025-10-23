'use client'

import { useState, useMemo } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { getActiveMenuFromPath, menuMappings, menuItems } from '@/constants/MenuData';
import type { MenuProps } from 'antd';

/**
 * 自定义Hook，用于管理菜单状态和缓存菜单数据
 * 适配Antd Menu组件的数据格式
 */
export const useMenuState = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  // 缓存当前活跃的菜单状态
  const activeMenuState = useMemo(() => {
    return getActiveMenuFromPath(pathname, searchParams);
  }, [pathname, searchParams]);
  
  // 当前选中的菜单项
  const selectedKeys = useMemo(() => {
    const keys: string[] = [];
    if (activeMenuState.subMenu) {
      keys.push(activeMenuState.subMenu);
    } else if (activeMenuState.mainMenu) {
      keys.push(activeMenuState.mainMenu);
    }
    return keys;
  }, [activeMenuState]);
  
  // 当前展开的菜单项
  const openKeys = useMemo(() => {
    const keys: string[] = [];
    if (activeMenuState.mainMenu) {
      keys.push(activeMenuState.mainMenu);
    }
    return keys;
  }, [activeMenuState]);
  
  // 处理菜单点击
  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    const path = menuMappings.menuKeyToPath[key];
    if (path) {
      router.push(path);
    }
  };
  
  // 返回菜单状态和处理函数
  return {
    showSidebar: pathname !== '/',
    selectedKeys,
    openKeys,
    menuItems: menuItems,
    handleMenuClick
  };
};

export default useMenuState;