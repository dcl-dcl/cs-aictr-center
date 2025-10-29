import { createGenerationTask, updateTaskStatus, insertTaskFiles, getTaskById } from '@/lib/repositories/task-repo';
import { TaskStatus, FileRole, TaskFile } from '@/types/TaskType';
import { AuthenticatedRequest } from '@/lib/auth/auth-middleware';
import { GcsService } from '@/lib/utils/gcs-service';

/**
 * 任务创建参数接口
 */
export interface TaskCreationParams {
  username: string;
  taskFromTab: string;
  prompt?: string;
  promptTrans?: string;
  model: string;
  parameters: any;
  projectId?: string;
}

/**
 * 文件信息接口
 */
export interface FileInfo {
  fileName: string;
  mimeType?: string;
  gcsUri: string;
  previewUrl?: string;
  aspectRatio?: string;
  role: FileRole;
}

/**
 * 任务执行结果接口
 */
export interface TaskExecutionResult {
  taskId: number;
  success: boolean;
  resultData?: any;
  error?: string;
}

/**
 * 通用任务管理服务类
 * 提供任务生命周期管理和文件存储功能，可在多个页面复用
 */
export class TaskManagementService {
  private gcsService: GcsService;

  constructor() {
    this.gcsService = new GcsService();
  }

  /**
   * 创建新任务
   * @param params 任务创建参数
   * @returns 任务ID
   */
  async createTask(params: TaskCreationParams): Promise<number> {
    const taskId = await createGenerationTask({
      project_id: params.projectId,
      username: params.username,
      task_from_tab: params.taskFromTab,
      prompt: params.prompt,
      prompt_trans: params.promptTrans,
      model: params.model,
      parameters: params.parameters,
      status: TaskStatus.PENDING,
      create_username: params.username
    });

    return taskId;
  }

  /**
   * 更新任务状态
   * @param taskId 任务ID
   * @param status 新状态
   * @param errorMessage 错误信息（可选）
   */
  async updateStatus(taskId: number, status: TaskStatus, errorMessage?: string): Promise<void> {
    await updateTaskStatus(taskId, status, errorMessage);
  }

  /**
   * 存储任务文件
   * @param taskId 任务ID
   * @param files 文件信息数组
   * @param username 用户名
   */
  async storeFiles(taskId: number, files: FileInfo[], username: string): Promise<void> {
    if (files.length === 0) return;

    const fileRecords = files.map(file => ({
      task_id: taskId,
      file_role: file.role,
      file_name: file.fileName,
      file_mime_type: file.mimeType || 'application/octet-stream',
      gcs_uri: file.gcsUri,
      preview_url: file.previewUrl || '',
      aspect_ratio: file.aspectRatio || '1:1',
      create_username: username
    }));

    await insertTaskFiles(fileRecords);
  }

  /**
   * 生成GCS签名URL
   * @param gcsUriOrUrl GCS URI或已有URL
   * @returns 签名URL
   */
  async generateSignedUrl(gcsUriOrUrl: string): Promise<string> {
    if (!gcsUriOrUrl) return '';

    try {
      // 如果已经是HTTP URL，直接返回
      if (gcsUriOrUrl.startsWith('http')) {
        return gcsUriOrUrl;
      }

      // 如果是GCS URI，生成signed URL
      if (gcsUriOrUrl.startsWith('gs://')) {
        return await this.gcsService.getClient().gcsUriToSignedUrl(gcsUriOrUrl);
      }

      return gcsUriOrUrl;
    } catch (error) {
      console.error('Failed to generate signed URL:', error);
      return gcsUriOrUrl;
    }
  }

  /**
   * 获取任务的输入文件
   * @param taskId 任务ID
   * @returns 输入文件数组
   */
  async getTaskInputFiles(taskId: number): Promise<TaskFile[]> {
    const task = await getTaskById(taskId);
    return task?.input_files || [];
  }

  /**
   * 从FormData中提取输入文件信息
   * @param formData 表单数据
   * @param taskId 任务ID
   * @param username 用户名
   * @returns 文件信息数组
   */
  async extractInputFiles(formData: FormData, taskId: number, username: string): Promise<FileInfo[]> {
    const files: FileInfo[] = [];

    // 处理personImages
    const personImages = formData.getAll("personImages") as File[];
    for (let i = 0; i < personImages.length; i++) {
      const file = personImages[i];
      if (file && file.size > 0) {
        try {
          // 上传文件到GCS
          const fileName = file.name || `person_image_${i + 1}`;
          const subFolder = `${username}/task_${taskId}/input/person`;
          const uploadResult = await this.gcsService.uploadToGCS(file, {
            subFolder,
            customFileName: fileName,
            returnSignedUrl: true
          });

          // 使用上传结果中的信息
          const gcsUri = uploadResult.gcsUri;
          const previewUrl = uploadResult.signedUrl || await this.generateSignedUrl(gcsUri);
          
          files.push({
            fileName: fileName,
            mimeType: file.type,
            gcsUri: gcsUri,
            previewUrl: previewUrl,
            aspectRatio: '1:1',
            role: FileRole.INPUT
          });
        } catch (error) {
          console.error(`Failed to upload person image ${i + 1}:`, error);
          throw new Error(`Failed to upload person image: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // 处理productImages
    const productImages = formData.getAll("productImages") as File[];
    for (let i = 0; i < productImages.length; i++) {
      const file = productImages[i];
      if (file && file.size > 0) {
        try {
          // 上传文件到GCS
          const fileName = file.name || `product_image_${i + 1}`;
          const subFolder = `${username}/task_${taskId}/input/product`;
          const uploadResult = await this.gcsService.uploadToGCS(file, {
            subFolder,
            customFileName: fileName,
            returnSignedUrl: true
          });

          // 使用上传结果中的信息
          const gcsUri = uploadResult.gcsUri;
          const previewUrl = uploadResult.signedUrl || await this.generateSignedUrl(gcsUri);
          
          files.push({
            fileName: fileName,
            mimeType: file.type,
            gcsUri: gcsUri,
            previewUrl: previewUrl,
            aspectRatio: '1:1',
            role: FileRole.INPUT
          });
        } catch (error) {
          console.error(`Failed to upload product image ${i + 1}:`, error);
          throw new Error(`Failed to upload product image: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // 通用 inputImages（Imagen 页面使用）
    const inputImages = formData.getAll("inputImages") as File[];
    for (let i = 0; i < inputImages.length; i++) {
      const file = inputImages[i];
      if (file && file.size > 0) {
        try {
          const fileName = file.name || `input_image_${i + 1}`;
          const subFolder = `${username}/task_${taskId}/input/common`;
          const uploadResult = await this.gcsService.uploadToGCS(file, {
            subFolder,
            customFileName: fileName,
            returnSignedUrl: true
          });

          const gcsUri = uploadResult.gcsUri;
          const previewUrl = uploadResult.signedUrl || await this.generateSignedUrl(gcsUri);

          files.push({
            fileName: fileName,
            mimeType: file.type,
            gcsUri: gcsUri,
            previewUrl: previewUrl,
            aspectRatio: '1:1',
            role: FileRole.INPUT
          });
        } catch (error) {
          console.error(`Failed to upload input image ${i + 1}:`, error);
          throw new Error(`Failed to upload input image: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    return files;
  }

  /**
   * 处理模型输出结果并存储文件
   * @param taskId 任务ID
   * @param resultData 模型输出结果
   * @param username 用户名
   * @returns 处理后的结果数据
   */
  async processOutputResults(taskId: number, resultData: any[], username: string): Promise<any[]> {
    const outputFiles: FileInfo[] = [];

    // 处理每个输出结果
    for (let i = 0; i < resultData.length; i++) {
      const result = resultData[i];
      
      if (result.gcsUri || result.url) {
        const gcsUri = result.gcsUri || result.url;
        const previewUrl = await this.generateSignedUrl(gcsUri);
        
        outputFiles.push({
          fileName: result.filename || `output_${i + 1}.png`,
          mimeType: 'image/png',
          gcsUri: gcsUri,
          previewUrl: previewUrl,
          aspectRatio: '1:1',
          role: FileRole.OUTPUT
        });

        // 更新结果数据中的预览URL
        resultData[i] = {
          ...result,
          url: previewUrl,
          signedUrl: previewUrl
        };
      }
    }

    // 存储输出文件
    if (outputFiles.length > 0) {
      await this.storeFiles(taskId, outputFiles, username);
    }

    return resultData;
  }

  /**
   * 执行完整的任务流程
   * @param request 认证请求对象
   * @param taskParams 任务参数
   * @param modelExecutor 模型执行函数
   * @param formData 可选的表单数据，用于处理输入文件
   * @returns 任务执行结果
   */
  async executeTask<T>(
    request: AuthenticatedRequest,
    taskParams: TaskCreationParams,
    modelExecutor: (taskId: number) => Promise<T>,
    formData?: FormData
  ): Promise<TaskExecutionResult> {
    let taskId: number | null = null;

    try {
      // 1. 创建任务
      taskId = await this.createTask(taskParams);

      // 2. 处理输入文件（如果提供了formData）
      if (formData) {
        const inputFiles = await this.extractInputFiles(formData, taskId, request.user.username);
        if (inputFiles.length > 0) {
          await this.storeFiles(taskId, inputFiles, request.user.username);
        }
      }

      // 3. 更新任务状态为处理中
      await this.updateStatus(taskId, TaskStatus.PROCESSING);

      // 4. 执行模型调用
      const resultData = await modelExecutor(taskId);

      // 5. 处理输出结果（如果是数组类型）
      let processedResults: any = resultData;
      if (Array.isArray(resultData)) {
        processedResults = await this.processOutputResults(taskId, resultData, request.user.username);
      }

      // 6. 更新任务状态为完成
      await this.updateStatus(taskId, TaskStatus.COMPLETED);

      return {
        taskId,
        success: true,
        resultData: processedResults
      };

    } catch (error) {
      // 更新任务状态为失败
      if (taskId) {
        await this.updateStatus(taskId, TaskStatus.FAILED, error instanceof Error ? error.message : 'Unknown error');
      }

      return {
        taskId: taskId || 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

// 导出单例实例
export const taskManagementService = new TaskManagementService();