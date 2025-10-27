'use client'

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { HomeOutlined, LogoutOutlined, DownOutlined, UserOutlined } from '@ant-design/icons';


const Navbar = () => {
  const pathname = usePathname()
  const router = useRouter()
  const [activeRoute, setActiveRoute] = useState(pathname)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState<string>('')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

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

  // 读取登录状态
  useEffect(() => {
    try {
      const token = localStorage.getItem('authToken')
      const userStr = localStorage.getItem('user')
      const userObj = userStr ? JSON.parse(userStr) : null
      const name = userObj?.username || userObj?.name || userObj?.email || ''
      setIsLoggedIn(!!token)
      setUserName(name)
    } catch (e) {
      console.warn('读取登录状态失败', e)
    }
  }, [])

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const handleLogout = () => {
    try {
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      // 清理认证 cookie，避免仍能通过 cookie 获取到 token
      document.cookie = 'authToken=; path=/; max-age=0; samesite=lax'
      document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax'
      setIsLoggedIn(false)
      setUserName('')
      router.push('/login')
    } catch (e) {
      console.warn('登出失败', e)
    }
  }

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
          
          {/* 导航链接与用户状态 */}
          <div className="flex items-center space-x-4">
            <Link href="/">
              <div
                className={`
                  relative px-6 py-3 rounded-full font-medium text-sm transition-all duration-300 cursor-pointer
                  ${activeRoute === '/' 
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105' 
                    : 'text-gray-700 hover:bg-white hover:shadow-md bg-white/50 backdrop-blur-sm'
                  }
                `}
              >
                <div className="flex items-center space-x-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center">
                    <HomeOutlined className="text-base" />
                  </span>
                  <span>首页</span>
                </div>
                
                {/* 活跃状态指示器 */}
                {activeRoute === '/' && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full shadow-lg"></div>
                )}
              </div>
            </Link>

            {/* 用户登录状态与登出 */}
            {isLoggedIn ? (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setIsMenuOpen(v => !v)}
                  className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-full px-6 py-3 border border-gray-200 hover:bg-white hover:shadow-md transition-all"
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white text-base font-semibold leading-none">
                    {userName ? userName[0].toUpperCase() : 'U'}
                  </span>
                  <span className="text-sm text-gray-800">{userName || '已登录'}</span>
                  <DownOutlined className="text-gray-500 text-sm" />
                </button>
                {isMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-35 p-2 bg-white rounded-xl shadow-xl ring-1 ring-black/5 z-50">
                    <div className="px-3 py-2 flex items-center space-x-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white text-base font-semibold leading-none">
                        {userName ? userName[0].toUpperCase() : 'U'}
                      </span>
                      <div className="text-sm font-medium text-gray-900">{userName || '已登录'}</div>
                    </div>
                    <div className="my-2 border-t border-gray-100"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2 rounded-md transition-colors"
                    >
                      <LogoutOutlined className="text-gray-600 text-base" style={{ color: 'black' }}/>
                      <span className='text-black'>退出登录</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-full px-6 py-3 border border-gray-200 hover:bg-white hover:shadow-md transition-all text-sm text-gray-800">
                <UserOutlined className="text-gray-600 text-base" style={{ color: 'black' }}/>
                <span className="text-sm text-gray-800">请登录</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar