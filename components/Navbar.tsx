'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';


const Navbar = () => {
  const pathname = usePathname()
  const [activeRoute, setActiveRoute] = useState(pathname)

  // 监听路由变化
  useEffect(() => {
    setActiveRoute(pathname)
    // 保存当前路由到本地存储
    localStorage.setItem('lastVisitedRoute', pathname)
  }, [pathname])

  // 组件挂载时恢复上次访问的路由信息
  useEffect(() => {
    const lastRoute = localStorage.getItem('lastVisitedRoute')
    if (lastRoute) {
      console.log('上次访问的路由:', lastRoute)
    }
  }, [])

  return (
    <nav className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 shadow-lg border-b border-gray-200">
      <div className="w-full px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo 和品牌名称 */}
          <Link href="/" className="flex items-center group">
            <div className="flex-shrink-0 flex items-center">
              <Image
                src="/WebEye_logo_RGB_Web-08.png"
                alt="Logo"
                width={200}
                height={120}
                className="object-contain group-hover:scale-105 transition-transform duration-300"
                priority
              />
            </div>
          </Link>
          
          {/* 导航链接 - 只保留Home按钮 */}
          <div className="flex items-center space-x-2">
            <Link href="/">
              <div
                className={`
                  relative px-6 py-3 rounded-full font-medium text-sm transition-all duration-300 cursor-pointer
                  ${activeRoute === '/' 
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105' 
                    : 'text-gray-700 hover:bg-white hover:shadow-md hover:scale-105 bg-white/50 backdrop-blur-sm'
                  }
                `}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🏠</span>
                  <span>首页</span>
                </div>
                
                {/* 活跃状态指示器 */}
                {activeRoute === '/' && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full shadow-lg"></div>
                )}
              </div>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar