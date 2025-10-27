import { NextResponse } from 'next/server'
import { query, getDbProvider } from '@/lib/db'

export async function GET() {
  try {
    const rows = await query<{ ok: number }>('SELECT 1 as ok')
    const ok = rows[0]?.ok === 1

    return NextResponse.json({
      success: ok,
      message: ok ? '数据库连接正常' : '数据库连接异常',
      data: {
        provider: getDbProvider(),
      }
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: '数据库连接失败',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}