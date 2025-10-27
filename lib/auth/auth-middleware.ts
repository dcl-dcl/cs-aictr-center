import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt, JwtPayload } from '@/lib/auth/jwt';
import { getUserById } from '@/lib/repositories/user-repo';


export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: number;
    username: string;
  };
}

// 验证用户认证
export async function verifyAuth(request: NextRequest): Promise<{ user: any; error?: string }> {
  // 仅支持标准 Authorization: Bearer <token>
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: '未提供有效的认证token' };
  }
  const token = authHeader.substring(7);

  try {
    const decoded = verifyJwt<JwtPayload>(token);
    
    // 从数据库查询用户信息（login 签发的是 { id, username, email }）
    const user = await getUserById(Number(decoded.id));

    if (!user) {
      return { user: null, error: '用户不存在' };
    }

    return { 
      user: {
        id: Number(user.id),
        username: user.username,
        email: user.email
      }
    };
  } catch (error) {
    return { user: null, error: '登录已过期' };
  }
}

// API路由包装器，自动处理认证和操作记录
export function withAuth(handler: (request: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    try {
      // 验证认证
      const { user, error } = await verifyAuth(request);
      
      if (error || !user) {
        return NextResponse.json(
          { success: false, message: error || '认证失败' },
          { status: 401 }
        );
      }
      // 将用户信息添加到请求对象
      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = user;
      return await handler(authenticatedRequest);

    } catch (error) {
      return NextResponse.json(
        { success: false, message: '服务器内部错误' },
        { status: 500 }
      );
    }
  };
}