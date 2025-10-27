import { query } from '@/lib/db'

export interface OperationRecord {
  id: number
  user_id: string | number
  operation_type: string
  operation_details: string
  created_at: string | Date
}

// 内存回退存储（当数据库不可用时）
const memoryOps: OperationRecord[] = []
let nextId = 1

/**
 * 记录用户操作（优先写入数据库，失败则写入内存）
 */
export async function addUserOperation(
  userId: string | number,
  operationType: string,
  operationDetails: string
): Promise<void> {
  try {
    await query(
      'INSERT INTO user_operations (user_id, operation_type, operation_details, created_at) VALUES (?, ?, ?, NOW())',
      [userId, operationType, operationDetails]
    )
  } catch {
    memoryOps.unshift({
      id: nextId++,
      user_id: userId,
      operation_type: operationType,
      operation_details: operationDetails,
      created_at: new Date()
    })
  }
}

/**
 * 分页查询用户操作（优先从数据库读取，失败使用内存回退）
 */
export async function getUserOperationsPaged(
  userId: string | number,
  page: number = 1,
  limit: number = 10
): Promise<{ operations: OperationRecord[]; total: number }> {
  const offset = (Math.max(page, 1) - 1) * Math.max(limit, 1)

  try {
    const rows = await query<OperationRecord>(
      'SELECT id, user_id, operation_type, operation_details, created_at FROM user_operations WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [userId, limit, offset]
    )
    const totalRows = await query<{ total: number }>(
      'SELECT COUNT(*) as total FROM user_operations WHERE user_id = ?',
      [userId]
    )
    const total = totalRows[0]?.total || 0
    return { operations: rows, total }
  } catch {
    const all = memoryOps.filter(op => String(op.user_id) === String(userId))
    const paged = all.slice(offset, offset + limit)
    return { operations: paged, total: all.length }
  }
}