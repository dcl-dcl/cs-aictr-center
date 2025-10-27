import type { DatabaseClient } from './types'
import { createMysqlClient } from './mysql'

let client: DatabaseClient | null = null

function ensureClient(): DatabaseClient {
  if (client) return client
  const provider = (process.env.DB_PROVIDER || 'mysql').toLowerCase()
  switch (provider) {
    case 'mysql':
      client = createMysqlClient()
      break
    default:
      throw new Error(`Unsupported DB_PROVIDER: ${provider}`)
  }
  return client!
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  return await ensureClient().query<T>(sql, params)
}

export async function closeDb(): Promise<void> {
  if (client && client.close) await client.close()
  client = null
}

export function getDbProvider(): string {
  return (process.env.DB_PROVIDER || 'mysql').toLowerCase()
}