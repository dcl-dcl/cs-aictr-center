import formidable from 'formidable';
import { GCS } from '@/lib/gcp-clients/gcs';
import fs from 'fs';
import path from 'path';

/**
 * 支持的文件输入类型
 */
type FileInput = Buffer | File | string | formidable.File;

/**
 * 支持的图片格式
 */
export type SupportedImageFormat = 'png' | 'jpg' | 'jpeg' | 'webp' | 'gif';

/**
 * 上传配置选项接口
 */
export interface UploadOptions {
  /** 子文件夹路径 */
  subFolder?: string;
  /** 是否返回签名URL */
  returnSignedUrl?: boolean;
  /** 是否检查文件是否已存在 */
  checkExists?: boolean;
  /** 自定义文件名 */
  customFileName?: string;
  /** 文件格式验证 */
  allowedFormats?: SupportedImageFormat[];
  /** 最大文件大小（字节） */
  maxFileSize?: number;
}

/**
 * 上传结果接口
 */
export interface UploadResult {
    /** 文件URL */
    gcsUri: string,
    signedUrl: string;
    /** 文件名 */
    fileName: string;
    /** 文件大小 */
    fileSize: number;
}

/**
 * GCS服务错误类
 */
export class GcsServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'GcsServiceError';
  }
}

/**
 * Google Cloud Storage 服务类
 * 提供文件上传、管理等功能
 */
export class GcsService {
  private readonly gcsClient: GCS;
  private readonly gcsBucket: string;
  private readonly defaultMaxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly supportedFormats: SupportedImageFormat[] = ['png', 'jpg', 'jpeg', 'webp', 'gif'];

  /**
   * 构造函数
   * @param gcsBucket GCS存储桶名称
   * @param serviceAccountPath 服务账户密钥文件路径
   */
  constructor(gcsBucket?: string, serviceAccountPath?: string) {
    try {
      this.gcsBucket = gcsBucket || process.env.GOOGLE_CLOUD_GCS_BUCKET || '';
      const credentials = serviceAccountPath || process.env.GOOGLE_APPLICATION_CREDENTIALS || '';
      this.gcsClient = new GCS(credentials);
    } catch (error) {
      if (error instanceof GcsServiceError) {
        throw error;
      }
      throw new GcsServiceError(
        'Failed to initialize GCS service',
        'INITIALIZATION_ERROR',
        error as Error
      );
    }
  }

  /**
   * 验证文件格式
   * @param fileName 文件名
   * @param allowedFormats 允许的格式列表
   * @returns 是否为有效格式
   */
  private validateFileFormat(fileName: string, allowedFormats?: SupportedImageFormat[]): boolean {
    const formats = allowedFormats || this.supportedFormats;
    const extension = path.extname(fileName).toLowerCase().slice(1) as SupportedImageFormat;
    return formats.includes(extension);
  }

  /**
   * 验证文件大小
   * @param fileSize 文件大小（字节）
   * @param maxSize 最大允许大小
   * @returns 是否在允许范围内
   */
  private validateFileSize(fileSize: number, maxSize?: number): boolean {
    const limit = maxSize || this.defaultMaxFileSize;
    return fileSize <= limit;
  }

  /**
   * 生成安全的文件名
   * @param originalName 原始文件名
   * @param customName 自定义文件名
   * @returns 安全的文件名
   */
  private generateSafeFileName(originalName?: string, customName?: string): string {
    if (customName) {
      // 清理自定义文件名中的不安全字符
      return customName.replace(/[^a-zA-Z0-9._-]/g, '_');
    }

    if (originalName) {
      const extension = path.extname(originalName);
      const baseName = path.basename(originalName, extension).replace(/[^a-zA-Z0-9._-]/g, '_');
      return `${baseName}_${Date.now()}${extension}`;
    }

    return `image_${Date.now()}.png`;
  }

  /**
   * 从不同类型的输入中提取文件信息
   * @param data 文件数据
   * @param customFileName 自定义文件名
   * @returns 文件信息对象
   */
  private async extractFileInfo(
    data: FileInput,
    customFileName?: string
  ): Promise<{ fileName: string; fileBuffer: Buffer; fileSize: number }> {
    let fileName: string;
    let fileBuffer: Buffer;
    let fileSize: number;

    try {
      if (data instanceof Buffer) {
        fileName = this.generateSafeFileName(undefined, customFileName);
        fileBuffer = data;
        fileSize = data.length;
      } else if (typeof data === 'string') {
        // Base64字符串处理
        fileName = this.generateSafeFileName(undefined, customFileName);
        fileBuffer = Buffer.from(data, 'base64');
        fileSize = fileBuffer.length;
      } else if (data instanceof File) {
        fileName = this.generateSafeFileName(data.name, customFileName);
        fileBuffer = Buffer.from(await data.arrayBuffer());
        fileSize = fileBuffer.length;
      } else {
        // formidable.File类型
        const formidableFile = data as formidable.File;
        fileName = this.generateSafeFileName(
          formidableFile.originalFilename || undefined,
          customFileName
        );
        
        if (!fs.existsSync(formidableFile.filepath)) {
          throw new GcsServiceError('File not found', 'FILE_NOT_FOUND');
        }
        
        fileBuffer = fs.readFileSync(formidableFile.filepath);
        fileSize = fileBuffer.length;
      }

      return { fileName, fileBuffer, fileSize };
    } catch (error) {
      throw new GcsServiceError(
        'Failed to extract file information',
        'FILE_EXTRACTION_ERROR',
        error as Error
      );
    }
  }

  /**
   * 通用文件上传方法
   * @param data 文件数据
   * @param options 上传选项
   * @returns 上传结果
   */
  async uploadToGCS(
    data: FileInput,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const {
      subFolder,
      returnSignedUrl = false,
      checkExists = true,
      customFileName,
    } = options;

    try {
      // 提取文件信息
      const { fileName, fileBuffer, fileSize } = await this.extractFileInfo(data, customFileName);
      // 构建目标文件路径
      const destinationBlobName = subFolder ? `${subFolder}/${fileName}` : fileName;
      const bucketName = this.gcsBucket.replace('gs://', '');
      // 目标文件路径
      // 检查文件是否已存在
      // if (checkExists) {
      //   try {
      //     const fileExists = await this.gcsClient.fileExists(bucketName, destinationBlobName);
      //     if (fileExists) {
      //       console.log(`File already exists: ${destinationBlobName}`);
      //       const url = returnSignedUrl 
      //         ? await this.gcsClient.generateSignedUrl(bucketName, destinationBlobName, 60 * 24)
      //         : `${this.gcsBucket}/${destinationBlobName}`;
    
      //       return {
      //         gcsUri: `${this.gcsBucket}/${destinationBlobName}`,
      //         signedUrl: url,
      //         fileName,
      //         fileSize,
      //       };
      //     }
      //   } catch (error) {
      //     console.warn('Failed to check file existence, proceeding with upload:', error);
      //   }
      // }
      // 上传文件
      await this.gcsClient.upload(bucketName, destinationBlobName, fileBuffer);

      // 生成返回URL
      const url = returnSignedUrl
        ? await this.gcsClient.generateSignedUrl(bucketName, destinationBlobName, 60 * 24)
        : "";
      return {
        gcsUri: `${this.gcsBucket}/${destinationBlobName}`,
        signedUrl: url,
        fileName,
        fileSize,
      };

    } catch (error) {
      if (error instanceof GcsServiceError) {
        throw error;
      }
      throw new GcsServiceError(
        'Failed to upload file to GCS',
        'UPLOAD_ERROR',
        error as Error
      );
    }
  }

  /**
   * 上传图片文件到GCS
   * @param file formidable文件对象
   * @param subFolder 子文件夹
   * @param returnSignedUrl 是否返回签名URL
   * @returns 文件URL
   */
  async uploadImageToGCS(
    file: formidable.File, 
    subFolder?: string,
    returnSignedUrl: boolean = false
  ): Promise<UploadResult> {
    console.log('upload Image To GCS', file.originalFilename);
    const result = await this.uploadToGCS(file, {
      subFolder,
      returnSignedUrl,
      checkExists: true,
      allowedFormats: ['png', 'jpg', 'jpeg', 'webp']
    });
    return result;
  }

  /**
   * 上传Base64编码的图片到GCS
   * @param base64String Base64字符串
   * @param mimeType MIME类型
   * @param subFolder 子文件夹
   * @param returnSignedUrl 是否返回签名URL
   * @returns 文件URL
   */
  async uploadBase64ToGCS(
    base64String: string, 
    mimeType: string, 
    subFolder?: string,
    returnSignedUrl: boolean = false
  ): Promise<UploadResult> {
    const extension = mimeType.split('/')[1] || 'png';
    const result = await this.uploadToGCS(base64String, {
      subFolder,
      returnSignedUrl,
      checkExists: false, 
      customFileName: `image_${Date.now()}.${extension}`,
      allowedFormats: ['png', 'jpg', 'jpeg', 'webp']
    });
    return result;
  }

  /**
   * 上传Buffer数据到GCS
   * @param buffer Buffer数据
   * @param fileName 文件名
   * @param subFolder 子文件夹
   * @param returnSignedUrl 是否返回签名URL
   * @returns 文件URL
   */
  async uploadBufferToGCS(
    buffer: Buffer,
    fileName: string,
    subFolder?: string,
    returnSignedUrl: boolean = false
  ): Promise<UploadResult> {
    const result = await this.uploadToGCS(buffer, {
      subFolder,
      returnSignedUrl,
      checkExists: false,
      customFileName: fileName
    });
    return result;
  }

  /**
   * 获取GCS客户端实例（用于高级操作）
   * @returns GCS客户端
   */
  getClient(): GCS {
    return this.gcsClient;
  }

  /**
   * 获取存储桶名称
   * @returns 存储桶名称
   */
  getBucketName(): string {
    return this.gcsBucket;
  }
}