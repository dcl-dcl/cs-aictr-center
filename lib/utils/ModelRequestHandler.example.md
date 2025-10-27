# ModelRequestHandler 使用示例

## 概述

`ModelRequestHandler` 是一个通用的模型请求处理器，提供以下核心功能：

1. **智能文件处理**：根据文件大小自动选择上传到GCS或转换为base64
2. **统一响应处理**：处理模型返回的gcsUri或base64数据，生成统一的URL格式
3. **灵活配置**：支持多种配置选项，适应不同场景需求

## 基本用法

### 1. 初始化

```typescript
import { ModelRequestHandler } from '@/lib/services/model-request-handler';

// 使用默认GcsService
const requestHandler = new ModelRequestHandler();

// 或使用自定义GcsService
const customGcsService = new GcsService();
const requestHandler = new ModelRequestHandler(customGcsService);
```

### 2. 处理上传文件

#### 单文件处理

```typescript
// 基本用法 - 10MB以上上传GCS，以下转base64
const result = await requestHandler.processFile(file, {
  subFolder: 'uploads'
});

// 强制上传到GCS
const result = await requestHandler.processFile(file, {
  subFolder: 'uploads',
  forceGcs: true
});

// 自定义大小阈值（5MB）
const result = await requestHandler.processFile(file, {
  subFolder: 'uploads',
  sizeThreshold: 5 * 1024 * 1024
});
```

#### 批量文件处理

```typescript
const files = formData.getAll("images");
const results = await requestHandler.processFiles(files, {
  subFolder: 'batch-uploads'
});
```

#### 便捷方法 - 直接生成模型请求数据

```typescript
// 单文件
const { imageData, fileInfo } = await requestHandler.processFileForModelRequest(file, {
  subFolder: 'model-inputs'
});

// 批量文件
const { imageDataArray, fileInfoArray } = await requestHandler.processFilesForModelRequest(files, {
  subFolder: 'model-inputs'
});
```

### 3. 处理模型响应

#### 基本响应处理

```typescript
// 模型返回的原始数据
const modelResults = [
  { gcsUri: 'gs://bucket/path/image1.png', mimeType: 'image/png' },
  { bytesBase64Encoded: 'iVBORw0KGgoAAAANSUhEUgAA...', mimeType: 'image/png' }
];

// 处理响应 - base64保持为data URL格式
const processedResults = await requestHandler.processModelResponse(modelResults, {
  taskIdPrefix: 'task-123',
  uploadBase64ToGcs: false
});

// 结果格式：
// [
//   {
//     id: 'task-123-0',
//     url: 'https://storage.googleapis.com/bucket/path/image1.png?X-Goog-Signature=...',
//     signedUrl: 'https://storage.googleapis.com/bucket/path/image1.png?X-Goog-Signature=...',
//     gcsUri: 'gs://bucket/path/image1.png',
//     mimeType: 'image/png'
//   },
//   {
//     id: 'task-123-1',
//     url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
//     mimeType: 'image/png'
//   }
// ]
```

#### 将base64结果上传到GCS

```typescript
// 将base64结果也上传到GCS并获取signedUrl
const processedResults = await requestHandler.processModelResponse(modelResults, {
  taskIdPrefix: 'task-123',
  uploadBase64ToGcs: true,
  base64SubFolder: 'model-results'
});

// 所有结果都会有gcsUri和signedUrl
```

## 在API路由中的完整示例

### imagen/route.ts 示例

```typescript
import { ModelRequestHandler } from '@/lib/services/model-request-handler';

const requestHandler = new ModelRequestHandler();

export async function POST(request: NextRequest) {
  const taskId = getTaskId();
  const formData = await request.formData();
  
  try {
    // 1. 处理输入文件
    const uploadedImages = formData.getAll("inputImages");
    const processResults = await requestHandler.processFiles(uploadedImages, {
      subFolder: "model-inputs"
    });
    
    // 2. 调用模型
    const modelResults = await someModel.generate(processResults);
    
    // 3. 处理模型响应
    const processedImages = await requestHandler.processModelResponse(modelResults, {
      taskIdPrefix: taskId,
      uploadBase64ToGcs: false, // 根据需求选择
      base64SubFolder: 'model-results'
    });
    
    return NextResponse.json({
      taskId,
      success: true,
      resultData: processedImages
    });
  } catch (error) {
    // 错误处理
  }
}
```

## 配置选项详解

### FileProcessOptions

```typescript
interface FileProcessOptions {
  /** 文件大小阈值（字节），默认10MB */
  sizeThreshold?: number;
  /** GCS子文件夹 */
  subFolder?: string;
  /** 是否强制上传到GCS */
  forceGcs?: boolean;
}
```

### ResponseProcessOptions

```typescript
interface ResponseProcessOptions {
  /** 任务ID前缀 */
  taskIdPrefix?: string;
  /** 是否将base64上传到GCS */
  uploadBase64ToGcs?: boolean;
  /** base64上传的子文件夹 */
  base64SubFolder?: string;
}
```

## 最佳实践

1. **文件大小阈值**：根据你的应用场景调整，通常10MB是一个合理的默认值
2. **GCS子文件夹**：使用有意义的文件夹名称，便于管理和查找
3. **base64处理**：对于需要持久化的结果（如生成的图片），建议设置 `uploadBase64ToGcs: true`
4. **错误处理**：始终包含适当的错误处理逻辑
5. **任务ID**：使用唯一的任务ID前缀，便于追踪和调试

## 迁移指南

### 从旧的FileProcessUtil迁移

```typescript
// 旧代码
import { processFileForTryOn, processFilesForModelRequest } from '@/utils/FileProcessUtil';

// 新代码
import { ModelRequestHandler } from '@/lib/services/model-request-handler';
const requestHandler = new ModelRequestHandler();

// 替换函数调用
// 旧：processFileForTryOn(file, gcsService, options)
// 新：requestHandler.processFileForModelRequest(file, options)

// 旧：processFilesForModelRequest(files, gcsService, options)
// 新：requestHandler.processFilesForModelRequest(files, options)
```

### 从手动响应处理迁移

```typescript
// 旧代码 - 手动处理gcsUri和base64
if (resultImages[0]?.gcsUri) {
  // 手动处理gcsUri...
} else if (resultImages[0]?.bytesBase64Encoded) {
  // 手动处理base64...
}

// 新代码 - 统一处理
const processedImages = await requestHandler.processModelResponse(resultImages, {
  taskIdPrefix: taskId,
  uploadBase64ToGcs: true
});
```