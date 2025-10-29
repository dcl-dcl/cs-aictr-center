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
      // 使用 query 而非 execute，避免某些场景下 (LIMIT/OFFSET/IN 动态占位符)
      // 触发 MySQL 服务器端预处理对占位符的限制从而报错：Incorrect arguments to mysqld_stmt_execute
      const [rows] = await pool.query(sql, params)
      return rows as any[]
    },
    async close() {
      await pool.end()
    }
  }
}