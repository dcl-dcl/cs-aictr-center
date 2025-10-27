import { NextRequest, NextResponse } from 'next/server';
import { login } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    const result = await login(username, password)

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: result.status || 401 }
      )
    }

    const { user, token } = result.data!

    const response = NextResponse.json(result)

    // 同步设置服务端 HttpOnly Cookie，供中间件与页面认证使用
    response.cookies.set('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 // 24h
    });

    return response;

  } catch (error) {
    console.error('登录错误:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  }
}