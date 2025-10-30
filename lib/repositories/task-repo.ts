import { query } from '../db'
import { GenerationTask, TaskFile, FileRole, TaskHistoryRequest, TaskStatus } from '@/types/TaskType'
import { GCS } from '@/lib/gcp-clients/gcs'

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
 * 解析 GCS v4 Signed URL 的过期时间
 * 使用查询参数中的 X-Goog-Date(UTC) 和 X-Goog-Expires(秒)
 */
function getSignedUrlExpiresAtMs(previewUrl?: string): number | null {
  if (!previewUrl) return null;
  try {
    const url = new URL(previewUrl);
    const xDate = url.searchParams.get('X-Goog-Date') || url.searchParams.get('x-goog-date');
    const xExpires = url.searchParams.get('X-Goog-Expires') || url.searchParams.get('x-goog-expires') || url.searchParams.get('Expires') || url.searchParams.get('exp');
    if (!xDate || !xExpires) return null;

    const m = xDate.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
    if (!m) return null;

    const baseUtcMs = Date.UTC(
      Number(m[1]),
      Number(m[2]) - 1,
      Number(m[3]),
      Number(m[4]),
      Number(m[5]),
      Number(m[6])
    );
    const ttlSec = Number(xExpires);
    if (!Number.isFinite(ttlSec)) return null;
    return baseUtcMs + ttlSec * 1000;
  } catch {
    return null;
  }
}

/**
 * 判断签名URL是否已过期（或无法解析），带少量时间偏移保护
 */
function isSignedUrlExpired(previewUrl?: string, skewSeconds: number = 60): boolean {
  const expiresAtMs = getSignedUrlExpiresAtMs(previewUrl);
  if (!expiresAtMs) return true;
  return Date.now() >= (expiresAtMs - skewSeconds * 1000);
}

/**
 * 刷新过期的预览链接：并发生成新签名URL，并一次性批量更新数据库
 * 返回已更新的 { file_id -> new_preview_url } 映射，用于响应数据中替换
 */
async function refreshExpiredPreviewUrls(files: RawFileData[]): Promise<Map<number, string>> {
  const expiredFiles = files.filter(f => isSignedUrlExpired(f.preview_url));
  if (expiredFiles.length === 0) return new Map();

  const gcs = new GCS();
  // 并发生成新URL，避免串行耗时
  const results = await Promise.all(
    expiredFiles.map(async (f) => {
      try {
        const url = await gcs.gcsUriToSignedUrl(f.gcs_uri);
        return { id: f.file_id, url };
      } catch (e) {
        // 如果生成失败，跳过该记录，不影响整体返回
        return null;
      }
    })
  );

  const updates = results.filter((r): r is { id: number; url: string } => !!r);
  if (updates.length === 0) return new Map();
  
  // 使用 CASE 批量更新，减少数据库交互次数，提升响应速度
  const updateSql = `
    UPDATE aictr_task_files
    SET preview_url = CASE id ${updates.map(() => 'WHEN ? THEN ?').join(' ')} END,
        update_time = CURRENT_TIMESTAMP
    WHERE id IN (${updates.map(() => '?').join(',')})
  `;
  const params = [
    ...updates.flatMap(u => [u.id, u.url]),
    ...updates.map(u => u.id)
  ];
  await query(updateSql, params);

  return new Map(updates.map(u => [u.id, u.url]));
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
      username,
      task_from_tab,
      prompt,
      prompt_trans,
      model,
      status,
      error_message,
      create_username,
      create_time
    FROM aictr_generation_tasks
    WHERE ${whereClause}
    ORDER BY create_time DESC
    LIMIT ? OFFSET ?
  `;
  const taskParams = [...queryParams, page_size, offset];
  const taskData = await query<RawTaskData>(taskSql, taskParams);
  
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
      update_time as file_update_time
    FROM aictr_generation_tasks
    WHERE task_id IN (${taskIds.map(() => '?').join(',')}) AND del_flag = 0
    ORDER BY create_time ASC
  `;
  
  const fileData = await query<RawFileData>(fileSql, taskIds);
  // 查看preview_url是否过期(通过preview_url中的exp参数) 链接示例：https://storage.googleapis.com/cs-demo-center/admin/task_15/input/person/10__8_.jpg?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=cs-demo-center%40my-project-at-475701.iam.gserviceaccount.com%2F20251029%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20251029T072559Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&response-content-disposition=attachment%3B%20filename%3D%2210__8_.jpg%22&X-Goog-Signature=931e3a665335ead2846f4a7bbb4024e36fec7e303bd6b95dabff30731cb6fd6a46070a24f3f99db413d4b283c74675fc96ffb58383ebd72694e8dbac170d3a1c668e55746962117a465a69522ead3fe4eb0060e71747c3e6e15f3db9ba3f23465be8d49a9dfeff4c3d011fdf7a5f81a8a5d86e88a1d11e653d0a867dbb7b675b80e4b14a8f5ccd568452d062182c8f15065850d7600189d6ad625d31619e48162fa9db0f4b41794fe8f0550e8bded80fbdc6c8584f9711c4a3349575ceef6230752fcae775756224d51d807c40e22a30ba8d5cb9d939ddfde0b07b3c74c42de4891fca1fe576b6825cd38e54f48d5cd04a0a7b38970ae3a34fb0a58a0fd4a490
  //通过X-Goog-Expires参数判断是否过期 应该是UTC时间
  // 如果过期就用gcs_uri重新生成preview_url 并更新到aictr_task_files
  // 刷新过期的预览链接，并返回最新的 URL 映射（file_id -> preview_url）
  const refreshedPreviewMap = await refreshExpiredPreviewUrls(fileData);
  
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
      preview_url: refreshedPreviewMap.get(file.file_id) ?? file.preview_url,
      aspect_ratio: file.aspect_ratio,
      update_time: file.file_update_time,
    };
    filesByTaskId.get(file.task_id)!.push(taskFile);
  });
  
  // 第五步：构建最终的任务对象
  const tasks: GenerationTask[] = taskData.map(taskRow => {
    const taskFiles = filesByTaskId.get(taskRow.id) || [];
    
    return {
      id: taskRow.id,
      username: taskRow.username,
      task_from_tab: taskRow.task_from_tab,
      prompt: taskRow.prompt,
      prompt_trans: taskRow.prompt_trans,
      model: taskRow.model,
      status: taskRow.status as any,
      error_message: taskRow.error_message,
      create_username: taskRow.create_username,
      create_time: taskRow.create_time,
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

/**
 * 仅分页查询 aictr_generation_tasks 基本信息（不加载文件）
 */
export async function getTaskHistorySummary(params: TaskHistoryRequest): Promise<{ tasks: GenerationTask[], total: number }> {
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
    whereConditions.push('create_time >= CONCAT(?, \" 00:00:00\")');
    queryParams.push(startDate);
  }

  if (endDate) {
    whereConditions.push('create_time <= CONCAT(?, \" 23:59:59\")');
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
  const rows = await query<RawTaskData>(taskSql, taskParams);

  // 组装为空文件的任务对象
  const tasks: GenerationTask[] = rows.map(row => ({
    id: row.id,
    project_id: row.project_id,
    username: row.username,
    task_from_tab: row.task_from_tab,
    prompt: row.prompt,
    prompt_trans: row.prompt_trans,
    model: row.model,
    status: row.status as any,
    error_message: row.error_message,
    create_username: row.create_username,
    create_time: row.create_time,
    update_time: row.update_time,
    del_flag: row.del_flag,
    input_files: [],
    output_files: []
  }));

  return { tasks, total };
}

/**
 * 根据 task_id 查询任务的输入/输出文件，并刷新过期的预览链接
 */
export async function getTaskFilesByTaskId(taskId: number): Promise<{ input_files: TaskFile[]; output_files: TaskFile[] }>{
  // 查询当前任务的文件记录
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
    WHERE task_id = ? AND del_flag = 0
    ORDER BY create_time ASC
  `;
  const fileRows = await query<RawFileData>(fileSql, [taskId]);

  // 刷新过期的预览链接
  const refreshedPreviewMap = await refreshExpiredPreviewUrls(fileRows);

  // 转换为 TaskFile
  const files: TaskFile[] = fileRows.map(row => ({
    id: row.file_id,
    task_id: row.task_id,
    file_role: row.file_role as FileRole,
    file_name: row.file_name,
    file_mime_type: row.file_mime_type,
    gcs_uri: row.gcs_uri,
    preview_url: refreshedPreviewMap.get(row.file_id) ?? row.preview_url,
    aspect_ratio: row.aspect_ratio,
    create_username: row.file_create_username,
    create_time: row.file_create_time,
    update_time: row.file_update_time,
    del_flag: row.file_del_flag
  }));

  return {
    input_files: files.filter(f => f.file_role === FileRole.INPUT),
    output_files: files.filter(f => f.file_role === FileRole.OUTPUT)
  };
}