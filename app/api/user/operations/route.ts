import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/auth-middleware';
import { getUserOperationsPaged } from '@/lib/repositories/operation-repo';

async function handleGetOperations(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const userId = request.user.id;

    // 使用仓储层进行数据库分页查询（内置内存回退）
    const { operations: paginatedOperations, total } = await getUserOperationsPaged(userId, page, limit);
    
    // 转换数据格式以匹配前端期望
    const formattedOperations = paginatedOperations.map(op => ({
      id: op.id,
      user_id: op.user_id,
      operation_type: op.operation_type,
      operation_details: op.operation_details,
      created_at: op.created_at
    }));

    return NextResponse.json({
      success: true,
      data: {
        operations: formattedOperations,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('获取用户操作记录失败:', error);
    return NextResponse.json(
      { success: false, message: '获取用户操作记录失败' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGetOperations);