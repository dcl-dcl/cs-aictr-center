
export interface BaseResponse {
    success: boolean;
    message: string;
    taskId: string;
    resultData?: any;
}

export interface ModelOption {
    label: string;
    value: string;
}

export interface MediaFile {
    id: string;
    url: string;
    gcsUri?: string;
    filename: string;
    mimeType: string;
    aspectRatio?: string;
}

export interface GenerateConfigOption {
    value: any;
    label: string;
}
  
export interface GenerateConfig {
    id: string;
    label: string;
    options: GenerateConfigOption[];
    defaultValue: any;
}

export interface AttributeGroup {
    id: string;
    label: string;
    options: {
      label: string;
      value: string;
    }[];
    required?: boolean;
    type?: 'select' | 'buttons';
    parent?: string;
    parentValue?: string;
}