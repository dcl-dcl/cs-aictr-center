import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 受保护页面的路径匹配：访问这些页面必须登录
export const config = {
  matcher: [
    '/imagen/:path*',
    '/tryon/:path*',
    '/veo/:path*',
    '/children/:path*'
  ]
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // API 路径认证改由各 API 路由的 withAuth/verifyAuth 处理，不在 middleware 中统一拦截

  // 页面路径的校验：登录页和公开资源放行
  if (pathname.startsWith('/login')) {
    return NextResponse.next()
  }

  const token = request.cookies.get('authToken')?.value

  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}