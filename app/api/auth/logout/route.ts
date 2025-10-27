import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/auth-middleware';

export async function POST(request: NextRequest) {
  try {
    // 验证用户认证
    const { user, error } = await verifyAuth(request);

    if (error || !user) {
      return NextResponse.json(
        { message: '未授权访问' },
        { status: 401 }
      );
    }
    const response = NextResponse.json({
      message: '退出登录成功'
    });

    // 清除服务端认证 Cookie
    response.cookies.set('authToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'lax',
      path: '/',
      maxAge: 0
    });

    return response;

  } catch (error) {
    console.error('退出登录错误:', error);
    return NextResponse.json(
      { message: '服务器内部错误' },
      { status: 500 }
    );
  }
}