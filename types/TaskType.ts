// 任务状态枚举
export enum TaskStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

// 文件角色枚举
export enum FileRole {
  INPUT = 'INPUT',
  OUTPUT = 'OUTPUT'
}

// 任务文件类型
export interface TaskFile {
  id: number;
  task_id: number;
  file_role: FileRole;
  file_name: string;
  file_mime_type?: string;
  gcs_uri: string;
  preview_url?: string;
  aspect_ratio: string;
  create_username?: string;
  create_time?: string;
  update_time?: string;
  del_flag?: number;
}

// 生成任务类型
export interface GenerationTask {
  id: number;
  project_id?: string;
  username: string;
  task_from_tab: string;
  prompt?: string;
  prompt_trans?: string;
  model: string;
  status: TaskStatus;
  error_message?: string;
  create_username: string;
  create_time?: string;
  update_time?: string;
  del_flag?: number;
  // 关联的文件
  input_files: TaskFile[];
  output_files: TaskFile[];
}

// TaskHistory分页查询请求参数
export interface TaskHistoryRequest {
  path: string;
  tab?: string;
  username?: string;
  page: number;
  page_size: number;
  startDate?: string;
  endDate?: string;
}

// TaskHistory分页查询响应
export interface TaskHistoryResponse {
  success: boolean;
  data: {
    tasks: GenerationTask[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
  message?: string;
}