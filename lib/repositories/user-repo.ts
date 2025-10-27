import { query } from '@/lib/db'

export interface UserRecord {
  id: number
  username: string | null
  realname: string | null
  email: string | null
  password: string | null
  password_hash: string | null
  avatar: string | null
  status: number | null
  create_time: string | Date | null
  update_time: string | Date | null
}

/**
 * 按用户名或邮箱查询用户（支持任意一个匹配）
 */
export async function findUserByUsernameOrEmail(identifier: string): Promise<UserRecord | null> {
    const rows = await query<UserRecord>(
      'SELECT id, username, realname, email, password, password_hash, avatar, status, create_time, update_time FROM `user` WHERE username = ? OR email = ? LIMIT 1',
      [identifier, identifier]
    )
    return rows[0] || null
}

/**
 * 保持向后兼容：仅按用户名查询
 */
export async function findUserByUsername(username: string): Promise<UserRecord | null> {
    const rows = await query<UserRecord>(
      'SELECT id, username, realname, email, password, password_hash, avatar, status, create_time, update_time FROM `user` WHERE username = ? LIMIT 1',
      [username]
    )
    return rows[0] || null
}

/**
 * 按用户ID查询用户
 */
export async function getUserById(id: number): Promise<UserRecord | null> {
    const rows = await query<UserRecord>(
      'SELECT id, username, realname, email, password, password_hash, avatar, status, create_time, update_time FROM `user` WHERE id = ? LIMIT 1',
      [id]
    )
    return rows[0] || null
}