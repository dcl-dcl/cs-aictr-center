import { BaseResponse, MediaFile } from './BaseType'

export interface VeoApiResponse extends BaseResponse {
  operationName?: string,
  done?: boolean,
  resultData?: Array<MediaFile>
}

// export interface VeoApiRequest {
//   operationName: string,
//   inputData?: Record<string, string | boolean | number | Array<string>>
// }