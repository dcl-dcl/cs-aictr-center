'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { List, Card, Button, Tag, Space, Popover, DatePicker, Skeleton, Empty, Alert, Tooltip, Pagination, Segmented } from 'antd'
import { ReloadOutlined, CalendarOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

// 全局请求缓存，防止重复API调用
const pendingRequests = new Map<string, Promise<any>>()
import { TaskFile, TaskStatus, GenerationTask } from '@/types/TaskType'
import { MediaFile } from '@/types/BaseType'
import { ImagePreview } from './MediaPreview'
import RowImageDisplay from './RowImageDisplay'
import { apiFetch } from '@/lib/utils/api-client'
const { RangePicker } = DatePicker

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
function getStatusTagColor(status: TaskStatus): string {
  switch (status) {
    case TaskStatus.COMPLETED:
      return 'green'
    case TaskStatus.PROCESSING:
      return 'orange'
    case TaskStatus.FAILED:
      return 'red'
    case TaskStatus.PENDING:
    default:
      return 'default'
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
  // 时间格式化器，减少重复计算成本
  const timeFormatter = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      })
    } catch {
      return null
    }
  }, [])
  
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
  // 详情展开与数据缓存
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null)
  const [detailsByTaskId, setDetailsByTaskId] = useState<Record<number, { input_files: TaskFile[]; output_files: TaskFile[] }>>({})
  const [detailsLoadingId, setDetailsLoadingId] = useState<number | null>(null)
  
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
    console.log(`[TaskHistory Debug] fetchHistory called:`, {
      page: currentPage,
      actualPath,
      actualTab,
      actualPageSize,
      actualDateRange,
      timestamp: new Date().toISOString(),
      requestKey
    });

    // 统一设置加载状态，确保每个组件实例都能正确显示loading
    setLoading(true);
    setError(null);

    // 生成请求参数
    const usePath = currentPath ?? path
    const useTab = currentTab ?? tab
    const usePageSize = currentPageSize ?? page_size
    const useDateRange = currentDateRange ?? dateRange
    const params = new URLSearchParams({
      path: usePath,
      ...(useTab && { tab: useTab }),
      page: currentPage.toString(),
      page_size: usePageSize.toString(),
      startDate: useDateRange.startDate,
      endDate: useDateRange.endDate
    })

    // 使用仅返回结果的数据请求Promise进行缓存，避免把 setState 绑定到首个发起者组件实例
    let requestPromise = pendingRequests.get(requestKey)
    if (!requestPromise) {
      requestPromise = (async () => {
        console.time('TaskHistory: fetch+parse')
        const response = await apiFetch(`/api/tasks/history?${params}`)
        const result = await response.json()
        console.timeEnd('TaskHistory: fetch+parse')
        return result
      })()
      pendingRequests.set(requestKey, requestPromise)
    } else {
      console.log(`[TaskHistory Debug] fetchHistory using cached request:`, { requestKey })
    }

    try {
      const result = await requestPromise
      if (result.success) {
        // 新/旧版本响应兼容处理
        if (result.data && typeof result.data === 'object' && 'tasks' in result.data) {
          const incomingTasks = Array.isArray(result.data.tasks) ? result.data.tasks : []
          const avgPromptLen = incomingTasks.length > 0 ? (
            incomingTasks.reduce((sum: number, t: any) => sum + (t?.prompt?.length || 0), 0) / incomingTasks.length
          ) : 0
          console.log('[TaskHistory Perf] tasks_count:', incomingTasks.length, 'avg_prompt_len:', Math.round(avgPromptLen))
          console.time('TaskHistory: state->render')
          setTasks(incomingTasks)
          setPagination({
            current_page: result.data.page || 1,
            page_size: result.data.page_size || usePageSize,
            total_count: result.data.total || 0,
            total_pages: result.data.total_pages || 0
          })
        } else {
          const incomingTasks = Array.isArray(result.data) ? result.data : []
          const avgPromptLen = incomingTasks.length > 0 ? (
            incomingTasks.reduce((sum: number, t: any) => sum + (t?.prompt?.length || 0), 0) / incomingTasks.length
          ) : 0
          console.log('[TaskHistory Perf] tasks_count:', incomingTasks.length, 'avg_prompt_len:', Math.round(avgPromptLen))
          console.time('TaskHistory: state->render')
          setTasks(incomingTasks)
          setPagination(result.pagination || {
            current_page: 1,
            page_size: usePageSize,
            total_count: 0,
            total_pages: 0
          })
        }
        return result
      } else {
        setError(result.message || '获取历史记录失败')
        throw new Error(result.message || '获取历史记录失败')
      }
    } catch (err) {
      console.error('获取历史记录失败:', err)
      setError('网络错误，请稍后重试')
      throw err
    } finally {
      setLoading(false)
      // 清理缓存，避免长时间保留旧请求
      pendingRequests.delete(requestKey)
    }
  }, [path, tab, page_size, dateRange])
  
  // 渲染提交耗时（从 setTasks 到组件渲染完成）
  useEffect(() => {
    try {
      console.timeEnd('TaskHistory: state->render')
    } catch {}
  }, [tasks])

  // 展开/收起任务详情，并在展开时按需拉取图片数据
  const openTaskDetails = useCallback(async (taskId: number) => {
    if (expandedTaskId === taskId) {
      setExpandedTaskId(null)
      return
    }
    setExpandedTaskId(taskId)
    // 已有缓存则不再请求
    if (detailsByTaskId[taskId]) return
    try {
      setDetailsLoadingId(taskId)
      const resp = await apiFetch(`/api/tasks/detail?task_id=${taskId}`)
      const result = await resp.json()
      if (result.success && result.data) {
        const { input_files = [], output_files = [] } = result.data
        setDetailsByTaskId(prev => ({ ...prev, [taskId]: { input_files, output_files } }))
      }
    } catch (e) {
      console.error('获取任务详情失败:', e)
    } finally {
      setDetailsLoadingId(null)
    }
  }, [expandedTaskId, detailsByTaskId])

  // 单条任务项（Memo），减少不相关状态变化导致的整列表重渲染
  const TaskItem = React.memo(function TaskItem({
    task,
    isExpanded,
    details,
    isLoading,
    openTaskDetails,
    timeFormatter
  }: {
    task: GenerationTask;
    isExpanded: boolean;
    details?: { input_files: TaskFile[]; output_files: TaskFile[] };
    isLoading: boolean;
    openTaskDetails: (id: number) => void;
    timeFormatter: Intl.DateTimeFormat | null;
  }) {
    const [hovered, setHovered] = useState(false)
    const statusDisplay = getStatusDisplay(task.status)

    return (
      <Card
        size="small"
        variant="outlined"
        className="shadow-sm hover:shadow-md transition-shadow w-full"
        style={{ width: '100%', minHeight: isExpanded ? undefined : 100 }}
        styles={{ body: { padding: 12 } }}
      >
        <div className="mb-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 mb-1 min-w-0">
                <div className="flex-1 min-w-0">
                  {task.prompt && (
                    <Tooltip title={<div className="whitespace-pre-wrap break-words">{task.prompt}</div>} placement="top">
                      <p className="text-sm text-gray-600 overflow-hidden">
                        <span className="truncate block w-full">
                          {task.prompt}
                        </span>
                      </p>
                    </Tooltip>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 min-w-0">
                    <span className="break-words max-w-full">模型: {task.model}</span>
                    <span className="break-words max-w-full">用户: {task.username}</span>
                    <span className="break-words max-w-full">时间: {timeFormatter ? timeFormatter.format(new Date(task.create_time)) : new Date(task.create_time).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <Tag color={getStatusTagColor(task.status)}>{statusDisplay.text}</Tag>
              <Button onClick={() => openTaskDetails(task.id)} size="small">
                {isExpanded ? '收起详情' : '查看详情'}
              </Button>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-3 border-t border-gray-100 pt-3">
            {isLoading && (
              <Skeleton active paragraph={{ rows: 2 }} />
            )}
            {details && (
              <>
                {details.input_files?.length > 0 && (
                  <div className="mb-2">
                    <div className="text-sm text-gray-600 mb-1">输入图片</div>
                    <RowImageDisplay images={details.input_files} />
                  </div>
                )}
                {task.status === TaskStatus.FAILED && task.error_message && (
                  <Alert style={{ marginBottom: 8 }} message={<span className="break-words whitespace-pre-wrap">错误信息: {task.error_message}</span>} type="error" showIcon />
                )}
                {details.output_files?.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">输出图片</div>
                    <ImagePreview
                      urlImages={convertTaskFilesToMediaFiles(details.output_files)}
                      title=""
                      showDownload={true}
                      showBatchDownload={false}
                      gridCols="grid-cols-1 sm:grid-cols-1 lg:grid-cols-4"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Card>
    )
  })

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
  // 保持顶部筛选与刷新控件固定，列表区域内处理加载/错误/空状态
  
  return (
    <div className={`${className}`}>
      <div className="space-y-6">
        {/* 标题和筛选器 */}
        <div className="space-y-4">
          {/* 时间范围筛选器（固定在顶部） */}
          <div className="sticky top-0 z-20 bg-white border-b border-gray-200 flex items-center justify-end mb-4 min-w-0 pb-2">
            <Space size={8} wrap>
              <div className="relative date-filter-dropdown">
                <Popover
                  content={
                    <div style={{ width: 320 }}>
                      <Space direction="vertical" size={8} style={{ width: '100%' }}>
                        <RangePicker
                          style={{ width: '100%' }}
                          allowClear
                          value={
                            dateRange.startDate && dateRange.endDate
                              ? [dayjs(dateRange.startDate), dayjs(dateRange.endDate)]
                              : null
                          }
                          onChange={(values) => {
                            const start = values?.[0]?.format('YYYY-MM-DD') || ''
                            const end = values?.[1]?.format('YYYY-MM-DD') || ''
                            setDateRange({ startDate: start, endDate: end })
                          }}
                        />
                        <Segmented
                          style={{ width: '100%' }}
                          options={[
                            { label: '全部', value: 'all' },
                            { label: '近7天', value: '7' },
                            { label: '近30天', value: '30' },
                            { label: '近90天', value: '90' }
                          ]}
                          onChange={(val) => {
                            const endDate = new Date()
                            if (val === 'all') {
                              setDateRange({ startDate: '', endDate: '' })
                              setShowDateFilter(false)
                              return
                            }
                            const days = Number(val as string)
                            const startDate = new Date()
                            startDate.setDate(startDate.getDate() - days)
                            setDateRange({
                              startDate: startDate.toISOString().split('T')[0],
                              endDate: endDate.toISOString().split('T')[0]
                            })
                            setShowDateFilter(false)
                          }}
                        />
                      </Space>
                    </div>
                  }
                  trigger="click"
                  open={showDateFilter}
                  onOpenChange={(open) => setShowDateFilter(open)}
                  placement="bottomRight"
                >
                  <Button icon={<CalendarOutlined />}>{
                    dateRange.startDate && dateRange.endDate
                      ? `${dateRange.startDate} ~ ${dateRange.endDate}`
                      : '时间'
                  }</Button>
                </Popover>
              </div>
              <Button
                onClick={() => fetchHistory(pagination.current_page, path, tab, page_size, dateRange)}
                disabled={loading}
                icon={<ReloadOutlined spin={loading} />}
              />
            </Space>
          </div>
        </div>
        
        {/* 历史记录列表区域：在此处显示加载骨架、错误、空状态或列表 */}
        <div className="space-y-6">
          {loading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} variant="outlined">
                  <Skeleton active paragraph={{ rows: 3 }} />
                </Card>
              ))}
            </div>
          )}
          
          {!loading && error && (
            <Alert
              message={error}
              type="error"
              action={
                <Button size="small" onClick={() => fetchHistory(1, path, tab, page_size, dateRange)}>
                  重试
                </Button>
              }
              showIcon
            />
          )}
          
          {!loading && !error && tasks.length === 0 && (
            <Empty description="暂无历史记录" />
          )}
          
          {!loading && !error && tasks.length > 0 && Array.isArray(tasks) && (
            <List
              itemLayout="vertical"
              style={{ width: '100%' }}
              dataSource={tasks}
              renderItem={(task) => (
                <List.Item style={{ padding: 0, width: '100%', marginBottom: 8 }} className="p-0">
                  <TaskItem
                    key={task.id}
                    task={task}
                    isExpanded={expandedTaskId === task.id}
                    details={detailsByTaskId[task.id]}
                    isLoading={detailsLoadingId === task.id}
                    openTaskDetails={openTaskDetails}
                    timeFormatter={timeFormatter}
                  />
                </List.Item>
              )}
            />
          )}
          {/* 分页控件 */}
          {!loading && !error && pagination.total_pages >= 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-6">
              <div className="text-sm text-gray-500 min-w-0">
                显示第 {((pagination.current_page - 1) * pagination.page_size) + 1} - {Math.min(pagination.current_page * pagination.page_size, pagination.total_count)} 条，共 {pagination.total_count} 条记录
              </div>
              <Pagination
                current={pagination.current_page}
                pageSize={pagination.page_size}
                total={pagination.total_count}
                showSizeChanger={false}
                onChange={(newPage) => {
                  setPagination(prev => ({ ...prev, current_page: newPage }))
                  fetchHistory(newPage, path, tab, page_size, dateRange)
                }}
              />
            </div>
          )}
        </div>

      </div>
    </div>
  )
}