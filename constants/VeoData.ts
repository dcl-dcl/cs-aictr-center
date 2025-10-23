export const GenerateVideoFromText = "文生视频";
export const GenerateVideoFromImage = "图生视频";

const Veo2ModelOptions = [
  {
    value: 'veo-2.0-generate-001',
    label: 'Veo 2.0 001'
  },
]

const Veo3ModelOptions = [
  {
    value: 'veo-3.1-generate-preview',
    label: 'Veo 3.1 Preview'
  },
  {
    value: 'veo-3.1-fast-generate-preview',
    label: 'Veo 3.1 Fast Preview'
  },
  {
    value: 'veo-3.0-generate-001',
    label: 'Veo 3.0 001'
  },
  {
    value: 'veo-3.0-generate-preview',
    label: 'Veo 3.0 Preview'
  },
  {
    value: 'veo-3.0-fast-generate-001',
    label: 'Veo 3.0 Fast'
  },
  {
    value: 'veo-3.0-fast-generate-preview',
    label: 'Veo 3.0 Fast Preview'
  },
]

export const VeoModelOptions = [
  ...Veo3ModelOptions,
  ...Veo2ModelOptions
]

export const SupportImageToVideoModelList = [
  'veo-3.1-generate-preview',
  'veo-3.1-fast-generate-preview',
  'veo-3.0-generate-preview',
  'veo-2.0-generate-001',
]

export const SupportFrameImageModelList = [
  'veo-3.1-generate-preview',
  'veo-3.1-fast-generate-preview',
  'veo-2.0-generate-001',
]


const defaultVeoConfigurations = [
    {
      id: 'aspectRatio',
      label: '视频比例',
      options: [
        { value: '16:9', label: '16:9' },
        { value: '9:16', label: '9:16' },
      ],
      defaultValue: '16:9'
  },
  {
    id: 'sampleCount',
    label: '视频数量',
    options: [
      { value: 1, label: '1个' },
      { value: 2, label: '2个' },
      { value: 3, label: '3个' },
      { value: 4, label: '4个' },
    ],
    defaultValue: 1
  },
    {
        id: 'durationSeconds',
        label: '视频时长',
        options: [
          { value: 8, label: '8秒' },
          { value: 7, label: '7秒' },
          { value: 6, label: '6秒' },
          { value: 5, label: '5秒' },
        ],
        defaultValue: 8
    },
    {
      id: 'personGeneration',
      label: '是否允许人物或人脸生成',
      options: [
        { value: 'allow_adult', label: '仅允许生成成年人' },
        { value: 'dont_allow', label: '禁止包含人物/人脸' },
      ],
      defaultValue: 'allow_adult'
  },
  {
    id: 'compressionQuality',
    label: '视频压缩质量',
    options: [
      { value: 'optimized', label: '优化' },
      { value: 'lossless', label: '无损' },
    ],
    defaultValue: 'optimized'
  },
  {
    id: 'enhancePrompt',
    label: '使用Gemini优化提示词',
    options: [
      { value: true, label: '允许' },
      { value: false, label: '禁止' },
    ],
    defaultValue: true
  },
]

const veo3SpecConfigurations = [
    {
        id: 'durationSeconds',
        label: '视频时长',
        options: [
          { value: 8, label: '8秒' },
          { value: 6, label: '6秒' },
          { value: 4, label: '4秒' },
        ],
        defaultValue: 8
  },
  {
    id: 'resolution',
    label: '视频分辨率',
    options: [
        { value: '720p', label: '720p' },
        { value: '1080p', label: '1080p' },
    ],
    defaultValue: '720p'
  },
  {
        id: 'generateAudio',
        label: '是否生成音频',
        options: [
            { value: false, label: '否' },
            { value: true, label: '是' },
        ],
        defaultValue: false
    },
]

export function getVeoConfigParameters(model: string) {
    if (model.startsWith('veo-3.')) {
        const configMap = new Map(
            defaultVeoConfigurations.map(config => [config.id, { ...config, options: [...config.options] }])
        );
        // 遍历veo3SpecConfigurations，替换或添加配置项，并将布尔类型的配置项移至数组末尾
        for (const specConfig of veo3SpecConfigurations) {
            configMap.set(specConfig.id, { ...specConfig, options: [...specConfig.options] });
        }
        // 将配置项分为布尔类型和非布尔类型
        const allConfigs = Array.from(configMap.values());
        const nonBooleanConfigs = allConfigs.filter(config => typeof config.defaultValue !== 'boolean');
        const booleanConfigs = allConfigs.filter(config => typeof config.defaultValue === 'boolean');
        // 将布尔类型的配置项移至数组末尾
        return [...nonBooleanConfigs, ...booleanConfigs];
    }
    
    return defaultVeoConfigurations;
}

export const VideoStyleAttributeData = []


