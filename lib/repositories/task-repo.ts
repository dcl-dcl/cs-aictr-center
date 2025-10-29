import { query } from '../db'
import { GenerationTask, TaskFile, FileRole, TaskHistoryRequest, TaskStatus } from '@/types/TaskType'

// 数据库原始任务数据类型
interface RawTaskData {
  id: number;
  project_id?: string;
  username: string;
  task_from_tab: string;
  prompt?: string;
  prompt_trans?: string;
  model: string;
  status: string;
  error_message?: string;
  create_username: string;
  create_time: string;
  update_time: string;
  del_flag: number;
}

// 数据库原始文件数据类型
interface RawFileData {
  file_id: number;
  task_id: number;
  file_role: string;
  file_name: string;
  file_mime_type?: string;
  gcs_uri: string;
  preview_url?: string;
  aspect_ratio: string;
  file_create_username: string;
  file_create_time: string;
  file_update_time: string;
  file_del_flag: number;
}

// 组合的原始数据类型
interface RawTaskWithFiles extends RawTaskData {
  file_id?: number;
  task_id?: number;
  file_role?: string;
  file_name?: string;
  file_mime_type?: string;
  gcs_uri?: string;
  preview_url?: string;
  aspect_ratio?: string;
  file_create_username?: string;
  file_create_time?: string;
  file_update_time?: string;
  file_del_flag?: number;
}



/**
 * 根据ID获取单个任务详情
 */
export async function getTaskById(taskId: number): Promise<GenerationTask | null> {
  const sql = `
    SELECT 
      t.id,
      t.project_id,
      t.username,
      t.task_from_tab,
      t.prompt,
      t.prompt_trans,
      t.model,
      t.status,
      t.error_message,
      t.create_username,
      t.create_time,
      t.update_time,
      t.del_flag,
      f.id as file_id,
      f.file_role,
      f.file_name,
      f.file_mime_type,
      f.gcs_uri,
      f.preview_url,
      f.aspect_ratio,
      f.create_username as file_create_username,
      f.create_time as file_create_time,
      f.update_time as file_update_time,
      f.del_flag as file_del_flag
    FROM aictr_generation_tasks t
    LEFT JOIN aictr_task_files f ON t.id = f.task_id AND f.del_flag = 0
    WHERE t.id = ? AND t.del_flag = 0
  `;
  const rawData = await query<RawTaskWithFiles>(sql, [taskId]);
  
  if (rawData.length === 0) {
    return null;
  }
  
  // 处理单个任务的数据
  const firstRow = rawData[0];
  const task: GenerationTask = {
    id: firstRow.id,
    project_id: firstRow.project_id,
    username: firstRow.username,
    task_from_tab: firstRow.task_from_tab,
    prompt: firstRow.prompt,
    prompt_trans: firstRow.prompt_trans,
    model: firstRow.model,
    status: firstRow.status as any,
    error_message: firstRow.error_message,
    create_username: firstRow.create_username,
    create_time: firstRow.create_time,
    update_time: firstRow.update_time,
    del_flag: firstRow.del_flag,
    input_files: [],
    output_files: []
  };
  
  // 处理文件数据
  rawData.forEach(row => {
    if (row.file_id) {
      const file: TaskFile = {
        id: row.file_id,
        task_id: row.task_id,
        file_role: row.file_role as FileRole,
        file_name: row.file_name!,
        file_mime_type: row.file_mime_type,
        gcs_uri: row.gcs_uri!,
        preview_url: row.preview_url,
        aspect_ratio: row.aspect_ratio!,
        create_username: row.file_create_username!,
        create_time: row.file_create_time!,
        update_time: row.file_update_time!,
        del_flag: row.file_del_flag!
      };
      
      if (file.file_role === FileRole.INPUT) {
        task.input_files.push(file);
      } else if (file.file_role === FileRole.OUTPUT) {
        task.output_files.push(file);
      }
    }
  });
  
  return task;
}

/**
 * 根据页面路径和tab获取历史记录（分页查询）
 */
export async function getTaskHistory(params: TaskHistoryRequest): Promise<{ tasks: GenerationTask[], total: number }> {
  const { path, tab, username, page, page_size, startDate, endDate } = params;
  
  // 构建task_from_tab查询条件
  let taskFromTab = path;
  if (tab) {
    taskFromTab = `${path}?tab=${tab}`;
  }
  
  // 构建WHERE条件
  const whereConditions: string[] = ['del_flag = 0', 'task_from_tab = ?'];
  const queryParams: any[] = [taskFromTab];
  
  if (username) {
    whereConditions.push('username = ?');
    queryParams.push(username);
  }
  
  // 添加时间范围筛选
  if (startDate) {
    whereConditions.push('create_time >= CONCAT(?, \' 00:00:00\')');
    queryParams.push(startDate);
  }
  
  if (endDate) {
    whereConditions.push('create_time <= CONCAT(?, \' 23:59:59\')');
    queryParams.push(endDate);
  }
  
  const whereClause = whereConditions.join(' AND ');
  
  // 第一步：查询总数
  const countSql = `
    SELECT COUNT(*) as total 
    FROM aictr_generation_tasks 
    WHERE ${whereClause}
  `;
  
  const countResult = await query<{ total: number }>(countSql, queryParams);
  const total = countResult[0]?.total || 0;
  
  // 如果没有数据，直接返回
  if (total === 0) {
    return { tasks: [], total: 0 };
  }
  
  // 第二步：分页查询任务基本信息
  const offset = (page - 1) * page_size;
  const taskSql = `
    SELECT 
      id,
      project_id,
      username,
      task_from_tab,
      prompt,
      prompt_trans,
      model,
      status,
      error_message,
      create_username,
      create_time,
      update_time,
      del_flag
    FROM aictr_generation_tasks
    WHERE ${whereClause}
    ORDER BY create_time DESC
    LIMIT ? OFFSET ?
  `;
  
  const taskParams = [...queryParams, page_size, offset];
  const taskData = await query<RawTaskData>(taskSql, taskParams);
  
  // 如果没有任务数据，直接返回
  if (taskData.length === 0) {
    return { tasks: [], total };
  }
  
  // 第三步：根据任务ID查询对应的文件
  const taskIds = taskData.map(task => task.id);
  const fileSql = `
    SELECT 
      id as file_id,
      task_id,
      file_role,
      file_name,
      file_mime_type,
      gcs_uri,
      preview_url,
      aspect_ratio,
      create_username as file_create_username,
      create_time as file_create_time,
      update_time as file_update_time,
      del_flag as file_del_flag
    FROM aictr_task_files
    WHERE task_id IN (${taskIds.map(() => '?').join(',')}) AND del_flag = 0
    ORDER BY create_time ASC
  `;
  
  const fileData = await query<RawFileData>(fileSql, taskIds);
  
  // 第四步：组装数据，将文件按任务分组
  const filesByTaskId = new Map<number, TaskFile[]>();
  
  fileData.forEach(file => {
    if (!filesByTaskId.has(file.task_id)) {
      filesByTaskId.set(file.task_id, []);
    }
    
    const taskFile: TaskFile = {
      id: file.file_id,
      task_id: file.task_id,
      file_role: file.file_role as FileRole,
      file_name: file.file_name,
      file_mime_type: file.file_mime_type,
      gcs_uri: file.gcs_uri,
      preview_url: file.preview_url,
      aspect_ratio: file.aspect_ratio,
      create_username: file.file_create_username,
      create_time: file.file_create_time,
      update_time: file.file_update_time,
      del_flag: file.file_del_flag
    };
    
    filesByTaskId.get(file.task_id)!.push(taskFile);
  });
  
  // 第五步：构建最终的任务对象
  const tasks: GenerationTask[] = taskData.map(taskRow => {
    const taskFiles = filesByTaskId.get(taskRow.id) || [];
    
    return {
      id: taskRow.id,
      project_id: taskRow.project_id,
      username: taskRow.username,
      task_from_tab: taskRow.task_from_tab,
      prompt: taskRow.prompt,
      prompt_trans: taskRow.prompt_trans,
      model: taskRow.model,
      status: taskRow.status as any,
      error_message: taskRow.error_message,
      create_username: taskRow.create_username,
      create_time: taskRow.create_time,
      update_time: taskRow.update_time,
      del_flag: taskRow.del_flag,
      input_files: taskFiles.filter(file => file.file_role === FileRole.INPUT),
      output_files: taskFiles.filter(file => file.file_role === FileRole.OUTPUT)
    };
  });
  
  return { tasks, total };
}

/**
 * 创建新的生成任务
 */
export async function createGenerationTask(taskData: {
  project_id?: string;
  username: string;
  task_from_tab: string;
  prompt?: string;
  prompt_trans?: string;
  model: string;
  parameters: any;
  status?: TaskStatus;
  create_username?: string;
}): Promise<number> {
  const sql = `
    INSERT INTO aictr_generation_tasks (
      project_id, username, task_from_tab, prompt, prompt_trans, 
      model, parameters, status, create_username
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const params = [
    taskData.project_id || null,
    taskData.username,
    taskData.task_from_tab,
    taskData.prompt || null,
    taskData.prompt_trans || null,
    taskData.model,
    JSON.stringify(taskData.parameters),
    taskData.status || TaskStatus.PENDING,
    taskData.create_username || 'system'
  ];
  
  const result = await query<any>(sql, params) as any;
  return result.insertId;
}

/**
 * 更新任务状态
 */
export async function updateTaskStatus(
  taskId: number, 
  status: TaskStatus, 
  errorMessage?: string
): Promise<void> {
  const sql = `
    UPDATE aictr_generation_tasks 
    SET status = ?, error_message = ?, update_time = CURRENT_TIMESTAMP 
    WHERE id = ?
  `;
  
  await query(sql, [status, errorMessage || null, taskId]);
}

/**
 * 插入任务文件记录
 */
export async function insertTaskFile(fileData: {
  task_id: number;
  file_role: FileRole;
  file_name: string;
  file_mime_type?: string;
  gcs_uri: string;
  preview_url?: string;
  aspect_ratio: string;
  create_username?: string;
}): Promise<number> {
  const sql = `
    INSERT INTO aictr_task_files (
      task_id, file_role, file_name, file_mime_type, 
      gcs_uri, preview_url, aspect_ratio, create_username
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const params = [
    fileData.task_id,
    fileData.file_role,
    fileData.file_name,
    fileData.file_mime_type || null,
    fileData.gcs_uri,
    fileData.preview_url || null,
    fileData.aspect_ratio,
    fileData.create_username || 'system'
  ];
  
  const result = await query<any>(sql, params) as any;
  return result.insertId;
}

/**
 * 批量插入任务文件记录
 */
export async function insertTaskFiles(filesData: Array<{
  task_id: number;
  file_role: FileRole;
  file_name: string;
  file_mime_type?: string;
  gcs_uri: string;
  preview_url?: string;
  aspect_ratio: string;
  create_username?: string;
}>): Promise<number[]> {
  if (filesData.length === 0) return [];
  
  const sql = `
    INSERT INTO aictr_task_files (
      task_id, file_role, file_name, file_mime_type, 
      gcs_uri, preview_url, aspect_ratio, create_username
    ) VALUES ${filesData.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(', ')}
  `;
  
  const params = filesData.flatMap(fileData => [
    fileData.task_id,
    fileData.file_role,
    fileData.file_name,
    fileData.file_mime_type || null,
    fileData.gcs_uri,
    fileData.preview_url || null,
    fileData.aspect_ratio,
    fileData.create_username || 'system'
  ]);
  
  const result = await query<any>(sql, params) as any;
  
  // 返回插入的ID数组
  const insertIds: number[] = [];
  for (let i = 0; i < filesData.length; i++) {
    insertIds.push(result.insertId + i);
  }
  return insertIds;
}