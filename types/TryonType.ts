import {BaseResponse, MediaFile} from './BaseType'

export interface TryOnApiResponse extends BaseResponse {
    resultData: Array<MediaFile>;
}