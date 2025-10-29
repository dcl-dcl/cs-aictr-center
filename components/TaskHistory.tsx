'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'

// 全局请求缓存，防止重复API调用
const pendingRequests = new Map<string, Promise<any>>()
import { TaskFile, TaskStatus, GenerationTask } from '@/types/TaskType'
import { MediaFile } from '@/types/BaseType'
import { ImagePreview } from './MediaPreview'
import StackedImageDisplay from './StackedImageDisplay'
import { apiFetch } from '@/lib/utils/api-client'

interface TaskHistoryProps {
  path: string
  tab?: string
  page?: number
  page_size?: number
  className?: string
  // 当该值变化时强制刷新历史列表
  refreshSignal?: number | string
}

interface PaginationInfo {
  current_page: number
  page_size: number
  total_count: number
  total_pages: number
}

// 将TaskFile转换为MediaFile格式
function convertTaskFilesToMediaFiles(taskFiles: TaskFile[]): MediaFile[] {
  return taskFiles.map((file, index) => ({
    id: file.id.toString(),
    url: file.preview_url || file.gcs_uri,
    gcsUri: file.gcs_uri,
    filename: file.file_name,
    mimeType: file.file_mime_type || 'image/jpeg',
    aspectRatio: file.aspect_ratio
  }))
}

// 获取任务状态的颜色和文本
function getStatusDisplay(status: TaskStatus) {
  switch (status) {
    case TaskStatus.COMPLETED:
      return {
        color: 'text-green-600 bg-green-50 border-green-200',
        text: '成功'
      }
    case TaskStatus.PROCESSING:
      return {
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
        text: '进行中'
      }
    case TaskStatus.FAILED:
      return {
        color: 'text-red-600 bg-red-50 border-red-200',
        text: '失败'
      }
    case TaskStatus.PENDING:
      return {
        color: 'text-gray-600 bg-gray-50 border-gray-200',
        text: '等待中'
      }
    default:
      return {
        color: 'text-gray-600 bg-gray-50 border-gray-200',
        text: '未知'
      }
  }
}

export default function TaskHistory({ 
  path, 
  tab, 
  page = 1,
  page_size = 10, 
  className = '',
  refreshSignal
}: TaskHistoryProps) {
  const [tasks, setTasks] = useState<GenerationTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDateFilter, setShowDateFilter] = useState(false)
  // const isLoadingRef = useRef(false)
  // const lastRequestRef = useRef<string>('')
  
  // 时间范围状态 - 默认最近7天
  const defaultDateRange = useMemo(() => {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 7)
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }
  }, [])
  
  const [dateRange, setDateRange] = useState(defaultDateRange)
  const [pagination, setPagination] = useState<PaginationInfo>({
    current_page: page,
    page_size: page_size,
    total_count: 0,
    total_pages: 0
  })
  
  const fetchHistory = useCallback(async (
    currentPage: number = 1,
    currentPath?: string,
    currentTab?: string,
    currentPageSize?: number,
    currentDateRange?: { startDate: string; endDate: string }
  ) => {
    const actualPath = currentPath || path;
    const actualTab = currentTab || tab;
    const actualPageSize = currentPageSize || page_size;
    const actualDateRange = currentDateRange || dateRange;

    // 生成请求参数的唯一标识
    const requestKey = JSON.stringify({
      page: currentPage,
      actualPath,
      actualTab,
      actualPageSize,
      actualDateRange
    });

    // 检查是否有相同的请求正在进行
    if (pendingRequests.has(requestKey)) {
      console.log(`[TaskHistory Debug] fetchHistory using cached request:`, { requestKey });
      try {
        const result = await pendingRequests.get(requestKey);
        return result;
      } catch (error) {
        // 如果缓存的请求失败，移除缓存并重新请求
        pendingRequests.delete(requestKey);
      }
    }

    console.log(`[TaskHistory Debug] fetchHistory called:`, {
      page: currentPage,
      actualPath,
      actualTab,
      actualPageSize,
      actualDateRange,
      timestamp: new Date().toISOString(),
      requestKey
    });

    setLoading(true);
    setError(null);

    // 创建请求Promise并缓存
    const requestPromise = (async () => {
      // 使用传入的参数或当前状态值
      const usePath = currentPath ?? path
      const useTab = currentTab ?? tab
      const usePageSize = currentPageSize ?? page_size
      const useDateRange = currentDateRange ?? dateRange
      
      try {
        const params = new URLSearchParams({
          path: usePath,
          ...(useTab && { tab: useTab }),
          page: currentPage.toString(),
          page_size: usePageSize.toString(),
          startDate: useDateRange.startDate,
          endDate: useDateRange.endDate
        })
        
        const response = await apiFetch(`/api/tasks/history?${params}`)
        const result = await response.json()
        
        if (result.success) {
          // 检查是否是新版本分页API响应（包含tasks字段）
          if (result.data && typeof result.data === 'object' && 'tasks' in result.data) {
            // 新版本API响应格式
            setTasks(Array.isArray(result.data.tasks) ? result.data.tasks : [])
            setPagination({
              current_page: result.data.page || 1,
              page_size: result.data.page_size || usePageSize,
              total_count: result.data.total || 0,
              total_pages: result.data.total_pages || 0
            })
          } else {
            // 旧版本API响应格式（向后兼容）
            setTasks(Array.isArray(result.data) ? result.data : [])
            setPagination(result.pagination || {
              current_page: 1,
              page_size: usePageSize,
              total_count: 0,
              total_pages: 0
            })
          }
          return result;
        } else {
          setError(result.message || '获取历史记录失败')
          throw new Error(result.message || '获取历史记录失败');
        }
      } catch (err) {
        console.error('获取历史记录失败:', err)
        setError('网络错误，请稍后重试')
        throw err;
      } finally {
        setLoading(false)
        // 清理缓存
        pendingRequests.delete(requestKey);
      }
    })();

    // 将Promise添加到缓存
    pendingRequests.set(requestKey, requestPromise);

    try {
      return await requestPromise;
    } catch (error) {
      // 请求失败时也要清理缓存
      pendingRequests.delete(requestKey);
      throw error;
    }
  }, [path, tab, page_size, dateRange])

  // 初始加载和依赖项变化时的处理
  useEffect(() => {
    console.log(`[TaskHistory Debug] useEffect triggered:`, {
      path,
      tab,
      page,
      page_size,
      dateRange,
      refreshSignal,
      timestamp: new Date().toISOString()
    });
    
    setPagination(prev => ({ ...prev, current_page: page }))
    fetchHistory(page, path, tab, page_size, dateRange);
  }, [path, tab, page, page_size, dateRange.startDate, dateRange.endDate, refreshSignal, fetchHistory])

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (showDateFilter && !target.closest('.date-filter-dropdown')) {
        setShowDateFilter(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDateFilter])
  
  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">加载历史记录中...</span>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className={`${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-700">{error}</span>
          </div>
          <button
            onClick={() => fetchHistory(1, path, tab, page_size, dateRange)}
            className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
          >
            重试
          </button>
        </div>
      </div>
    )
  }
  
  if (tasks.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p>暂无历史记录</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className={`${className}`}>
      <div className="space-y-6">
        {/* 标题和筛选器 */}
        <div className="space-y-4">
          {/* 时间范围筛选器 */}
          <div className="flex items-center justify-end mb-4 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              {/* 时间下拉菜单 */}
               <div className="relative date-filter-dropdown">
                <button
                  onClick={() => setShowDateFilter(!showDateFilter)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-gray-700">时间</span>
                  <svg className={`w-4 h-4 text-gray-500 transition-transform ${showDateFilter ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* 下拉菜单内容 */}
                {showDateFilter && (
                  <div className="absolute top-full right-0 mt-1 w-72 sm:w-80 max-w-[90vw] bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <div className="p-4">
                      {/* 日期范围输入 */}
                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 mb-4">
                        <input
                          type="date"
                          value={dateRange.startDate}
                          onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="开始日期"
                        />
                        <span className="text-gray-400">—</span>
                        <input
                          type="date"
                          value={dateRange.endDate}
                          onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="结束日期"
                        />
                      </div>
                      
                      {/* 快捷选择 */}
                      <div className="space-y-1">
                        <button
                          onClick={() => {
                            setDateRange({ startDate: '', endDate: '' })
                            setShowDateFilter(false)
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          全部
                        </button>
                        <button
                          onClick={() => {
                            const endDate = new Date()
                            const startDate = new Date()
                            startDate.setDate(startDate.getDate() - 7)
                            setDateRange({
                              startDate: startDate.toISOString().split('T')[0],
                              endDate: endDate.toISOString().split('T')[0]
                            })
                            setShowDateFilter(false)
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          最近一周
                        </button>
                        <button
                          onClick={() => {
                            const endDate = new Date()
                            const startDate = new Date()
                            startDate.setDate(startDate.getDate() - 30)
                            setDateRange({
                              startDate: startDate.toISOString().split('T')[0],
                              endDate: endDate.toISOString().split('T')[0]
                            })
                            setShowDateFilter(false)
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          最近一个月
                        </button>
                        <button
                          onClick={() => {
                            const endDate = new Date()
                            const startDate = new Date()
                            startDate.setDate(startDate.getDate() - 90)
                            setDateRange({
                              startDate: startDate.toISOString().split('T')[0],
                              endDate: endDate.toISOString().split('T')[0]
                            })
                            setShowDateFilter(false)
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          最近三个月
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* 刷新按钮 */}
              <button
                onClick={() => fetchHistory(pagination.current_page, path, tab, page_size, dateRange)}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* 历史记录列表 */}
        <div className="space-y-6">
          {Array.isArray(tasks) && tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6"
            >
              {/* 任务信息头部 */}
              <div className="mb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* 输入图片堆叠显示在提示词上方 */}
                    {/* 输入图片和提示词并排展示 */}
                    <div className="flex items-start gap-3 mb-3 min-w-0">
                      {/* 输入图片 */}
                      {task.input_files && task.input_files.length > 0 && (
                        <div className="flex-shrink-0">
                          <StackedImageDisplay  images={task.input_files}/>
                        </div>
                      )}
                      {/* 提示词与模型信息上下排列在同一容器 */}
                      <div className="flex-1 min-w-0">
                        {task.prompt && (
                          <div className="relative group min-w-0">
                            <p className="text-sm text-gray-600 overflow-hidden">
                              <span className="truncate block w-full">
                                {task.prompt}
                              </span>
                            </p>
                            {/* Hover时显示完整提示词 */}
                            <div className="absolute left-0 top-full mt-1 p-3 bg-gray-800 text-white text-sm rounded-lg shadow-lg z-20 max-w-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none">
                              <div className="whitespace-pre-wrap break-words">
                                {task.prompt}
                              </div>
                              {/* 小箭头 */}
                              <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-800 rotate-45"></div>
                            </div>
                          </div>
                        )}
                        <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                          <span>模型: {task.model}</span>
                          <span>用户: {task.username}</span>
                          <span>时间: {new Date(task.create_time).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    
                  </div>
                  <div className="flex-shrink-0">
                    {(() => {
                      const statusDisplay = getStatusDisplay(task.status);
                      return (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusDisplay.color}`}>
                          {statusDisplay.text}
                        </span>
                      );
                    })()}
                  </div>
                </div>
                
                {/* 错误信息显示 */}
                {task.status === TaskStatus.FAILED && task.error_message && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                    <span className="font-medium">错误信息:</span> {task.error_message}
                  </div>
                )}
              </div>
              
              {/* 输出图片展示区域 */}
              {task.output_files && task.output_files.length > 0 && (
                <div>
                  <ImagePreview 
                    urlImages={convertTaskFilesToMediaFiles(task.output_files)}
                    title=""
                    showDownload={true}
                    showBatchDownload={false}
                    gridCols="grid-cols-1 sm:grid-cols-1 lg:grid-cols-4"
                  />
                </div>
              )}
              
            </div>
          ))}
          {/* 分页控件 */}
          {pagination.total_pages >= 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 pt-6">
              <div className="text-sm text-gray-500">
                显示第 {((pagination.current_page - 1) * pagination.page_size) + 1} - {Math.min(pagination.current_page * pagination.page_size, pagination.total_count)} 条，共 {pagination.total_count} 条记录
              </div>
              
              <div className="flex items-center gap-2">
                {/* 上一页按钮 */}
                <button
                  onClick={() => {
                  const newPage = pagination.current_page - 1
                  setPagination(prev => ({ ...prev, current_page: newPage }))
                  fetchHistory(newPage, path, tab, page_size, dateRange)
                }}
                  disabled={pagination.current_page <= 1}
                  className="px-3 py-2 text-sm text-black border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  上一页
                </button>
                
                {/* 页码按钮 */}
                <div className="flex items-center gap-1">
                  {(() => {
                    const pages = []
                    const currentPage = pagination.current_page
                    const totalPages = pagination.total_pages
                    
                    // 显示逻辑：始终显示第1页，当前页附近的页码，最后一页
                    let startPage = Math.max(1, currentPage - 2)
                    let endPage = Math.min(totalPages, currentPage + 2)
                    
                    // 如果当前页靠近开始，显示更多后面的页码
                    if (currentPage <= 3) {
                      endPage = Math.min(totalPages, 5)
                    }
                    
                    // 如果当前页靠近结束，显示更多前面的页码
                    if (currentPage >= totalPages - 2) {
                      startPage = Math.max(1, totalPages - 4)
                    }
                    
                    // 添加第1页
                    if (startPage > 1) {
                      pages.push(
                        <button
                          key={1}
                          onClick={() => {
                            setPagination(prev => ({ ...prev, current_page: 1 }))
                            fetchHistory(1, path, tab, page_size, dateRange)
                          }}
                          className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          1
                        </button>
                      )
                      
                      if (startPage > 2) {
                        pages.push(
                          <span key="start-ellipsis" className="px-2 text-gray-400">...</span>
                        )
                      }
                    }
                    
                    // 添加中间页码
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => {
                        setPagination(prev => ({ ...prev, current_page: i }))
                        fetchHistory(i, path, tab, page_size, dateRange)
                      }}
                          className={`px-3 py-2 text-sm border rounded-lg transition-colors ${
                            i === currentPage
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {i}
                        </button>
                      )
                    }
                    
                    // 添加最后一页
                    if (endPage < totalPages) {
                      if (endPage < totalPages - 1) {
                        pages.push(
                          <span key="end-ellipsis" className="px-2 text-gray-400">...</span>
                        )
                      }
                      
                      pages.push(
                        <button
                          key={totalPages}
                          onClick={() => {
                            setPagination(prev => ({ ...prev, current_page: totalPages }))
                            fetchHistory(totalPages, path, tab, page_size, dateRange)
                          }}
                          className="px-3 py-2 text-sm text-black border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          {totalPages}
                        </button>
                      )
                    }
                    
                    return pages
                  })()}
                </div>
                
                {/* 下一页按钮 */}
                <button
                  onClick={() => {
                  const newPage = pagination.current_page + 1
                  setPagination(prev => ({ ...prev, current_page: newPage }))
                  fetchHistory(newPage, path, tab, page_size, dateRange)
                }}
                  disabled={pagination.current_page >= pagination.total_pages}
                  className="px-3 py-2 text-sm text-black border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}