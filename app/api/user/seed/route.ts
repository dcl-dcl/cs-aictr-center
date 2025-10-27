import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { query } from '@/lib/db'

type SeedBody = {
  username?: string
  email?: string
  password?: string
  realname?: string
}

export async function POST(req: NextRequest) {
  try {
    const body: SeedBody = await req.json().catch(() => ({}))

    const username = body.username?.trim() || 'testuser'
    const email = body.email?.trim() || 'test@example.com'
    const password = body.password || 'Test@12345'
    const realname = body.realname?.trim() || '测试用户'

    // Hash password using bcrypt
    const passwordHash = bcrypt.hashSync(password, 10)

    // Check if user exists by username or email
    const existing = await query<{ id: number }>(
      'SELECT `id` FROM `user` WHERE `username` = ? OR `email` = ? LIMIT 1',
      [username, email]
    )

    let userId: number

    if (existing.length > 0) {
      userId = existing[0].id
      // Update password_hash for existing user
      await query(
        'UPDATE `user` SET `password_hash` = ?, `update_time` = NOW() WHERE `id` = ?',
        [passwordHash, userId]
      )
    } else {
      // Auto-increment id insert
      await query(
        'INSERT INTO `user` (`username`, `realname`, `email`, `password`, `password_hash`, `avatar`, `status`, `create_time`, `update_time`) VALUES (?, ?, ?, NULL, ?, NULL, 1, NOW(), NOW())',
        [username, realname, email, passwordHash]
      )
      const inserted = await query<{ id: number }>(
        'SELECT `id` FROM `user` WHERE `username` = ? LIMIT 1',
        [username]
      )
      userId = inserted[0]?.id || 0
    }

    return NextResponse.json({
      success: true,
      message: '测试用户已就绪（存在则更新密码，不存在则创建）',
      user: { id: userId, username, email, realname },
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || '未知错误',
      },
      { status: 500 }
    )
  }
}