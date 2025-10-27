import { verifyPassword } from '@/lib/auth/password'
import { findUserByUsernameOrEmail } from '@/lib/repositories/user-repo'
import { signJwt } from './jwt'

export interface LoginResult {
  success: boolean
  message: string
  data?: {
    user: { id: number; username: string; email?: string }
    token: string
  }
  status?: number
}

export async function login(identifier: string, password: string): Promise<LoginResult> {
  if (!identifier || !password) {
    return { success: false, message: '用户名/邮箱和密码不能为空', status: 400 }
  }

  // 支持用户名或邮箱登录
  const user = await findUserByUsernameOrEmail(identifier)
  const storedHash = user?.password_hash || user?.password || ''
  if (!user || !(await verifyPassword(password, storedHash))) {
    return { success: false, message: '用户名/邮箱或密码错误', status: 401 }
  }
  const token = signJwt({ id: Number(user.id), username: user.username, email: user.email })
  return {
    success: true,
    message: '登录成功',
    data: {
      user: {
        id: Number(user.id),
        username: user.username,
        email: user.email
      },
      token
    }
  }
}