import mysql from 'mysql2/promise'
import type { DatabaseClient } from './types'

export function createMysqlClient(): DatabaseClient {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  })

  return {
    async query(sql, params = []) {
      const [rows] = await pool.execute(sql, params)
      return rows as any[]
    },
    async close() {
      await pool.end()
    }
  }
}