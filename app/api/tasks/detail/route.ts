import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/auth/auth-middleware'
import { getTaskById, getTaskFilesByTaskId } from '@/lib/repositories/task-repo'

export const dynamic = 'force-dynamic'

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const taskIdParam = searchParams.get('task_id')
    if (!taskIdParam) {
      return NextResponse.json({ success: false, message: 'task_id is required' }, { status: 400 })
    }
    const task_id = parseInt(taskIdParam, 10)
    if (Number.isNaN(task_id)) {
      return NextResponse.json({ success: false, message: 'task_id must be a number' }, { status: 400 })
    }

    // 基本任务信息
    const task = await getTaskById(task_id)
    if (!task) {
      return NextResponse.json({ success: false, message: 'Task not found' }, { status: 404 })
    }
    // 刷新文件的预览URL并返回完整详情
    const { input_files, output_files } = await getTaskFilesByTaskId(task_id)
    const taskWithFiles = { ...task, input_files, output_files }

    return NextResponse.json({ success: true, data: taskWithFiles })
  } catch (error: any) {
    console.error('[tasks/detail] error:', error?.message || error)
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
})