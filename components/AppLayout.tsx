'use client'

import React, { Suspense } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Navbar from '@/components/Navbar'
import LayoutWrapper from '@/components/LayoutWrapper'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

const ConditionalLayout: React.FC<ConditionalLayoutProps> = ({ children }) => {
  const pathname = usePathname()
  const router = useRouter()
  const showChrome = pathname !== '/login'

  // 客户端兜底：未登录访问受保护页面时重定向到登录页
  // 保护范围与 middleware 保持一致
  useEffect(() => {
    if (!showChrome) return;
    const protectedPrefixes = ['/imagen', '/tryon', '/veo', '/children']
    if (protectedPrefixes.some(p => pathname.startsWith(p))) {
      const lsToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
      const hasCookie = typeof document !== 'undefined' ? /(?:^|; )authToken=/.test(document.cookie) : false
      if (!lsToken && !hasCookie) {
        router.replace('/login')
      }
    }
  }, [pathname, showChrome, router])

  return (
    <div className="h-screen flex flex-col relative">
      {showChrome && <Navbar />}
      {showChrome ? (
        <Suspense fallback={<div />}> 
          <LayoutWrapper>{children}</LayoutWrapper>
        </Suspense>
      ) : (
        <>{children}</>
      )}
    </div>
  )
}

export default ConditionalLayout