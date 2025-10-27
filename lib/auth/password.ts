import bcrypt from 'bcryptjs'
import crypto from 'crypto'

function isBcrypt(hash: string) {
  return /^\$2[aby]\$/.test(hash)
}

function verifyScrypt(plain: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const derived = crypto.scryptSync(plain, salt, 64).toString('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(derived, 'hex'), Buffer.from(hash, 'hex'))
  } catch {
    return derived === hash
  }
}

export async function verifyPassword(plain: string, storedHash: string): Promise<boolean> {
  if (!storedHash) return false
  if (isBcrypt(storedHash)) {
    return await bcrypt.compare(plain, storedHash)
  }
  return verifyScrypt(plain, storedHash)
}