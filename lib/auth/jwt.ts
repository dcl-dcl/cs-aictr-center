import jwt from 'jsonwebtoken'

export interface JwtPayload {
  id: number
  username: string
  email?: string
}

export function getJwtSecret(): string {
  return process.env.JWT_SECRET || 'your-secret-key'
}

export function signJwt(payload: JwtPayload, expiresIn: string | number = '24h'): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn })
}

export function verifyJwt<T extends object = JwtPayload>(token: string): T {
  return jwt.verify(token, getJwtSecret()) as T
}