import formidable from 'formidable';
import { GcsService } from '@/utils/GcsUtil';
import { GCS } from '@/lib/gcs';
import { fileToBase64 } from '@/utils/MediaUtil';

/**
 * 文件处理结果接口
 */
export interface FileProcessResult {
  useGcs: boolean;
  gcsUri?: string;
  base64Data?: string;
  mimeType: string;
  fileName: string;
  fileSize: number;
}

/**
 * 模型响应图像数据接口
 */
export interface ModelResponseImage {
  gcsUri?: string;
  bytesBase64Encoded?: string;
  mimeType: string;
  [key: string]: any;
}

/**
 * 处理后的响应图像接口
 */
export interface ProcessedResponseImage {
  id: string;
  url: string;
  mimeType: string;
  gcsUri?: string;
  signedUrl?: string;
  [key: string]: any;
}

/**
 * 文件处理选项
 */
export interface FileProcessOptions {
  /** 文件大小阈值（字节），默认10MB */
  sizeThreshold?: number;
  /** GCS子文件夹 */
  subFolder?: string;
  /** 是否强制上传到GCS */
  forceGcs?: boolean;
}

/**
 * 响应处理选项
 */
export interface ResponseProcessOptions {
  /** 任务ID前缀 */
  taskIdPrefix?: string;
  /** 是否将base64上传到GCS */
  uploadBase64ToGcs?: boolean;
  /** base64上传的子文件夹 */
  base64SubFolder?: string;
}

/**
 * 通用模型请求处理器
 * 提供文件上传和模型响应处理的通用功能
 */
export class ModelRequestHandler {
  private gcsService: GcsService;
  private gcsClient: GCS;
  private defaultSizeThreshold: number = 10 * 1024 * 1024; // 10MB

  constructor(gcsService?: GcsService) {
    this.gcsService = gcsService || new GcsService();
    this.gcsClient = this.gcsService.getClient();
  }

  /**
   * 处理单个文件
   * @param file 文件对象
   * @param options 处理选项
   * @returns 文件处理结果
   */
  async processFile(
    file: formidable.File | File,
    options: FileProcessOptions = {}
  ): Promise<FileProcessResult> {
    const {
      sizeThreshold = this.defaultSizeThreshold,
      subFolder = 'uploads',
      forceGcs = false
    } = options;

    const fileSize = file.size || 0;
    // 兼容 formidable.File 和 File 类型的文件名获取
    const fileName = ('originalFilename' in file ? file.originalFilename : file instanceof File ? file.name : undefined) || 'unknown';
    const mimeType = ('mimetype' in file ? file.mimetype : file instanceof File ? file.type : undefined) || 'application/octet-stream';

    // 判断是否需要上传到GCS
    const shouldUseGcs = forceGcs || fileSize >= sizeThreshold;

    if (shouldUseGcs) {
      // 上传到GCS
      let uploadResult;
      if ('filepath' in file) {
        // formidable.File 类型
        uploadResult = await this.gcsService.uploadImageToGCS(file as formidable.File, subFolder);
      } else {
        // 浏览器 File 类型，需要先转换为 base64 再上传
        const base64Data = await fileToBase64(file);
        uploadResult = await this.gcsService.uploadBase64ToGCS(base64Data, mimeType, subFolder);
      }
      return {
        useGcs: true,
        gcsUri: uploadResult.gcsUri,
        mimeType,
        fileName,
        fileSize
      };
    } else {
      // 转换为base64
      const base64Data = await fileToBase64(file);
      return {
        useGcs: false,
        base64Data,
        mimeType,
        fileName,
        fileSize
      };
    }
  }

  /**
   * 批量处理文件
   * @param files 文件数组
   * @param options 处理选项
   * @returns 文件处理结果数组
   */
  async processFiles(
    files: (formidable.File | File)[],
    options: FileProcessOptions = {}
  ): Promise<FileProcessResult[]> {
    return Promise.all(
      files.map(file => this.processFile(file, options))
    );
  }

  /**
   * 创建模型请求的图像数据格式
   * @param processResult 文件处理结果
   * @returns 模型请求图像数据
   */
  createImageDataForModelRequest(processResult: FileProcessResult) {
    if (processResult.useGcs) {
      return {
        gcsUri: processResult.gcsUri,
        mimeType: processResult.mimeType
      };
    } else {
      return {
        bytesBase64Encoded: processResult.base64Data,
        mimeType: processResult.mimeType
      };
    }
  }

  /**
   * 批量创建模型请求图像数据
   * @param processResults 文件处理结果数组
   * @returns 模型请求图像数据数组
   */
  createImageDataArrayForModelRequest(processResults: FileProcessResult[]) {
    return processResults.map(result => this.createImageDataForModelRequest(result));
  }

  /**
   * 处理模型响应图像
   * @param responseImages 模型返回的图像数据
   * @param options 响应处理选项
   * @returns 处理后的图像数据
   */
  async processModelResponse(
    responseImages: ModelResponseImage[],
    options: ResponseProcessOptions = {}
  ): Promise<ProcessedResponseImage[]> {
    const {
      taskIdPrefix = 'task',
      uploadBase64ToGcs = false,
      base64SubFolder = 'model-results'
    } = options;

    const results: ProcessedResponseImage[] = [];

    for (let index = 0; index < responseImages.length; index++) {
      const image = responseImages[index];
      const id = `${taskIdPrefix}-${index}`;

      if (image.gcsUri) {
        // 处理GCS URI
        const signedUrl = await this.gcsClient.gcsUriToSignedUrl(image.gcsUri);
        results.push({
          ...image,
          id,
          url: signedUrl,
          signedUrl,
          gcsUri: image.gcsUri
        });
      } else if (image.bytesBase64Encoded) {
        // 处理base64数据
        if (uploadBase64ToGcs) {
          // 选择上传到GCS
          try {
            const gcsUri = await this.uploadBase64ToGcs(
              image.bytesBase64Encoded,
              image.mimeType,
              base64SubFolder,
              `${id}.${this.getFileExtensionFromMimeType(image.mimeType)}`
            );
            const signedUrl = await this.gcsClient.gcsUriToSignedUrl(gcsUri);
            results.push({
              ...image,
              id,
              url: signedUrl,
              signedUrl,
              gcsUri
            });
          } catch (error) {
            console.warn(`Failed to upload base64 to GCS for ${id}, falling back to data URL:`, error);
            // 失败时回退到data URL
            results.push({
              ...image,
              id,
              url: `data:${image.mimeType};base64,${image.bytesBase64Encoded}`
            });
          }
        } else {
          // 直接使用data URL格式
          results.push({
            ...image,
            id,
            url: `data:${image.mimeType};base64,${image.bytesBase64Encoded}`
          });
        }
      } else {
        throw new Error(`Invalid image data format for image ${index}`);
      }
    }

    return results;
  }

  /**
   * 将base64数据上传到GCS
   * @param base64Data base64编码的数据
   * @param mimeType MIME类型
   * @param subFolder 子文件夹
   * @param fileName 文件名
   * @returns GCS URI
   */
  private async uploadBase64ToGcs(
    base64Data: string,
    mimeType: string,
    subFolder: string,
    fileName: string
  ): Promise<string> {
    const uploadResult = await this.gcsService.uploadBase64ToGCS(
      base64Data,
      mimeType,
      subFolder
    );
    return uploadResult.gcsUri;
  }

  /**
   * 根据MIME类型获取文件扩展名
   * @param mimeType MIME类型
   * @returns 文件扩展名
   */
  private getFileExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: { [key: string]: string } = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'video/quicktime': 'mov'
    };
    return mimeToExt[mimeType] || 'bin';
  }

  /**
   * 便捷方法：处理文件并创建模型请求数据
   * @param file 文件
   * @param options 处理选项
   * @returns 包含图像数据和文件信息的对象
   */
  async processFileForModelRequest(
    file: formidable.File | File,
    options: FileProcessOptions = {}
  ) {
    const processResult = await this.processFile(file, options);
    return {
      imageData: this.createImageDataForModelRequest(processResult),
      fileInfo: processResult
    };
  }

  /**
   * 便捷方法：批量处理文件并创建模型请求数据
   * @param files 文件数组
   * @param options 处理选项
   * @returns 包含图像数据数组和文件信息数组的对象
   */
  async processFilesForModelRequest(
    files: (formidable.File | File)[],
    options: FileProcessOptions = {}
  ) {
    const processResults = await this.processFiles(files, options);
    return {
      imageDataArray: this.createImageDataArrayForModelRequest(processResults),
      fileInfoArray: processResults
    };
  }
}

// 导出默认实例
export const modelRequestHandler = new ModelRequestHandler();

// 导出便捷函数
export const {
  processFile,
  processFiles,
  createImageDataForModelRequest,
  createImageDataArrayForModelRequest,
  processModelResponse,
  processFileForModelRequest,
  processFilesForModelRequest
} = modelRequestHandler;