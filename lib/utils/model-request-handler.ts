import formidable from 'formidable'
import { GcsService } from '@/lib/utils/gcs-service'
import { GCS } from '@/lib/gcp-clients/gcs'
import { fileToBase64 } from '@/lib/utils/media-util'

export interface FileProcessResult {
  useGcs: boolean
  gcsUri?: string
  base64Data?: string
  mimeType: string
  fileName: string
  fileSize: number
}

export interface ModelResponseImage {
  gcsUri?: string
  bytesBase64Encoded?: string
  mimeType: string
  [key: string]: any
}

export interface ProcessedResponseImage {
  id: string
  url: string
  mimeType: string
  gcsUri?: string
  signedUrl?: string
  [key: string]: any
}

export interface FileProcessOptions {
  sizeThreshold?: number
  subFolder?: string
  forceGcs?: boolean
}

export interface ResponseProcessOptions {
  taskIdPrefix?: string
  uploadBase64ToGcs?: boolean
  base64SubFolder?: string
}

export class ModelRequestHandler {
  private gcsService: GcsService
  private gcsClient: GCS
  private defaultSizeThreshold: number = 10 * 1024 * 1024

  constructor(gcsService?: GcsService) {
    this.gcsService = gcsService || new GcsService()
    this.gcsClient = this.gcsService.getClient()
  }

  async processFile(
    file: formidable.File | File,
    options: FileProcessOptions = {}
  ): Promise<FileProcessResult> {
    const {
      sizeThreshold = this.defaultSizeThreshold,
      subFolder = 'uploads',
      forceGcs = false
    } = options

    const fileSize = file.size || 0
    const fileName = ('originalFilename' in file ? file.originalFilename : file instanceof File ? file.name : undefined) || 'unknown'
    const mimeType = ('mimetype' in file ? file.mimetype : file instanceof File ? file.type : undefined) || 'application/octet-stream'

    const shouldUseGcs = forceGcs || fileSize >= sizeThreshold

    if (shouldUseGcs) {
      let uploadResult
      if ('filepath' in file) {
        uploadResult = await this.gcsService.uploadImageToGCS(file as formidable.File, subFolder)
      } else {
        const base64Data = await fileToBase64(file)
        uploadResult = await this.gcsService.uploadBase64ToGCS(base64Data, mimeType, subFolder)
      }
      return {
        useGcs: true,
        gcsUri: uploadResult.gcsUri,
        mimeType,
        fileName,
        fileSize
      }
    } else {
      const base64Data = await fileToBase64(file)
      return {
        useGcs: false,
        base64Data,
        mimeType,
        fileName,
        fileSize
      }
    }
  }

  async processFiles(
    files: (formidable.File | File)[],
    options: FileProcessOptions = {}
  ): Promise<FileProcessResult[]> {
    return Promise.all(files.map(file => this.processFile(file, options)))
  }

  createImageDataForModelRequest(processResult: FileProcessResult) {
    if (processResult.useGcs) {
      return {
        gcsUri: processResult.gcsUri,
        mimeType: processResult.mimeType
      }
    } else {
      return {
        bytesBase64Encoded: processResult.base64Data,
        mimeType: processResult.mimeType
      }
    }
  }

  createImageDataArrayForModelRequest(processResults: FileProcessResult[]) {
    return processResults.map(result => this.createImageDataForModelRequest(result))
  }

  async processModelResponse(
    responseImages: ModelResponseImage[],
    options: ResponseProcessOptions = {}
  ): Promise<ProcessedResponseImage[]> {
    const {
      taskIdPrefix = 'task',
      uploadBase64ToGcs = false,
      base64SubFolder = 'model-results'
    } = options

    const results: ProcessedResponseImage[] = []

    for (let index = 0; index < responseImages.length; index++) {
      const image = responseImages[index]
      const id = `${taskIdPrefix}-${index}`

      if (image.gcsUri) {
        const signedUrl = await this.gcsClient.gcsUriToSignedUrl(image.gcsUri)
        results.push({
          ...image,
          id,
          url: signedUrl,
          signedUrl,
          gcsUri: image.gcsUri
        })
      } else if (image.bytesBase64Encoded) {
        if (uploadBase64ToGcs) {
          try {
            const gcsUri = await this.uploadBase64ToGcs(
              image.bytesBase64Encoded,
              image.mimeType,
              base64SubFolder,
              `${id}.${this.getFileExtensionFromMimeType(image.mimeType)}`
            )
            const signedUrl = await this.gcsClient.gcsUriToSignedUrl(gcsUri)
            results.push({
              ...image,
              id,
              url: signedUrl,
              signedUrl,
              gcsUri
            })
          } catch (error) {
            results.push({
              ...image,
              id,
              url: `data:${image.mimeType};base64,${image.bytesBase64Encoded}`
            })
          }
        } else {
          results.push({
            ...image,
            id,
            url: `data:${image.mimeType};base64,${image.bytesBase64Encoded}`
          })
        }
      } else {
        throw new Error(`Invalid image data format for image ${index}`)
      }
    }

    return results
  }

  private async uploadBase64ToGcs(
    base64Data: string,
    mimeType: string,
    subFolder: string,
    fileName: string
  ): Promise<string> {
    const result = await this.gcsService.uploadBase64ToGCS(base64Data, mimeType, subFolder, false)
    return result.gcsUri
  }

  private getFileExtensionFromMimeType(mimeType: string): string {
    const map: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/webp': 'webp',
      'image/gif': 'gif'
    }
    return map[mimeType] || 'png'
  }

  async processFileForModelRequest(
    file: formidable.File | File,
    options: FileProcessOptions = {}
  ) {
    const processResult = await this.processFile(file, options)
    return {
      imageData: this.createImageDataForModelRequest(processResult),
      fileInfo: processResult
    }
  }

  async processFilesForModelRequest(
    files: (formidable.File | File)[],
    options: FileProcessOptions = {}
  ) {
    const processResults = await this.processFiles(files, options)
    return {
      imageDataArray: this.createImageDataArrayForModelRequest(processResults),
      fileInfoArray: processResults
    }
  }
}

export const modelRequestHandler = new ModelRequestHandler()

export const {
  processFile,
  processFiles,
  createImageDataForModelRequest,
  createImageDataArrayForModelRequest,
  processModelResponse,
  processFileForModelRequest,
  processFilesForModelRequest
} = modelRequestHandler