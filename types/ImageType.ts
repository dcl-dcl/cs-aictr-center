import {BaseResponse, MediaFile} from './BaseType'

export interface ImagenApiResponse extends BaseResponse {
    resultData: Array<MediaFile>;
}