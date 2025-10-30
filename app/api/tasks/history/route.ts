import { NextRequest, NextResponse } from 'next/server'
import { getTaskHistorySummary } from '@/lib/repositories/task-repo'
import { TaskHistoryResponse } from '@/types/TaskType'
import { withAuth, AuthenticatedRequest } from '@/lib/auth/auth-middleware'

async function handleGET(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')
    const tab = searchParams.get('tab')
    // 从认证的用户信息中获取username，不再从查询参数获取
    const username = request.user?.username
    const pageStr = searchParams.get('page')
    const pageSizeStr = searchParams.get('page_size')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    if (!path) {
      return NextResponse.json({
        success: false,
        message: '缺少必需参数: path'
      }, { status: 400 })
    }
    // 新版本分页API
    const page = pageStr ? parseInt(pageStr) : 1
    const page_size = pageSizeStr ? parseInt(pageSizeStr) : 20
    
    if (page < 1) {
      return NextResponse.json({
        success: false,
        message: 'page参数无效，必须大于0'
      }, { status: 400 })
    }
    
    if (page_size < 1 || page_size > 100) {
      return NextResponse.json({
        success: false,
        message: 'page_size参数无效，范围应为1-100'
      }, { status: 400 })
    }
    
    const result = await getTaskHistorySummary({
      path,
      tab: tab || undefined,
      username: username || undefined,
      page,
      page_size,
      startDate: startDate || undefined,
      endDate: endDate || undefined
    })
    
    const total_pages = Math.ceil(result.total / page_size)
    
    const response: TaskHistoryResponse = {
      success: true,
      data: {
        tasks: result.tasks,
        total: result.total,
        page,
        page_size,
        total_pages
      }
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('获取历史记录失败:', error)
    
    return NextResponse.json({
      success: false,
      message: '服务器内部错误'
    }, { status: 500 })
  }
}

// 使用认证中间件包装GET函数
export const GET = withAuth(handleGET)

// 支持OPTIONS请求用于CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}