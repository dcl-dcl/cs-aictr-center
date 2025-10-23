import { ModelOption, GenerateConfigOption, GenerateConfig } from "@/types/BaseType";

export const GeminiModelOptions: ModelOption[] = [
    {
        value: "gemini-2.5-flash-image",
        label: "Nano Banana",
    },
]

export const ImagenModelOptions: ModelOption[] = [
    {
        value: "imagen-4.0-generate-001",
        label: "Imagen 4.0",
    },
    {
        value: "imagen-4.0-ultra-generate-001",
        label: "Imagen 4.0 Ultra",
    },
    {
        value: "imagen-4.0-fast-generate-001",
        label: "Imagen 4.0 Fast",
    },
    {
        value: "imagen-3.0-generate-002",
        label: "Imagen 3.0 002",
    },
    {
        value: "imagen-3.0-generate-001",
        label: "Imagen 3.0 001",
    },
    {
        value: "imagen-3.0-fast-generate-001",
        label: "Imagen 3.0 Fast",
    },
    // {
    //     value: "imagegeneration@006",
    //     label: "imagegeneration@006",
    // },
    // {
    //     value: "imagegeneration@005",
    //     label: "imagegeneration@005",
    // },
    // {
    //     value: "imagegeneration@002",
    //     label: "imagegeneration@002",
    // },
]

export const GeminiModelList = GeminiModelOptions.map(item => item.value)
export const ImagenModelList = ImagenModelOptions.map(item => item.value)


const getMaxSampleCount = (modelName: string): number => {
    return modelName === 'imagegeneration@002' ? 8 : 4;
};
  

const getAspectRatioOptions = (modelName: string): GenerateConfigOption[] => {
    const aspectRatios: { [key: string]: string[] } = {
      'imagegeneration@005': ['1:1', '9:16'],
      'imagegeneration@002': ['1:1']
    };
  
    const ratios = aspectRatios[modelName] || ['1:1', '9:16', '16:9', '3:4', '4:3'];
    return ratios.map(ratio => ({ value: ratio, label: ratio }));
};


export const getImagenModelConfigs = (modelName: string): GenerateConfig[] => {
    const configs: GenerateConfig[] = [];
  
    // aspectRatio配置
    const aspectRatioOptions = getAspectRatioOptions(modelName);
    if (aspectRatioOptions.length > 0) {
      configs.push({
        id: 'aspectRatio',
        label: '图片比例',
        options: aspectRatioOptions,
        defaultValue: '1:1'
      });
    }
  
    // sampleCount配置
    const maxCount = getMaxSampleCount(modelName);
    const sampleCountOptions: GenerateConfigOption[] = [];
    for (let i = 1; i <= maxCount; i++) {
      sampleCountOptions.push({ value: i, label: `${i}张` });
    }
    configs.push({
      id: 'sampleCount',
      label: '生成数量',
      options: sampleCountOptions,
      defaultValue: 1
    });
  
    if (modelName === 'imagegeneration@002') {
      configs.push({
        id: 'sampleImageStyle',
        label: '图片风格',
        options: [
          { value: 'photograph', label: '摄影' },
          { value: 'digital_art', label: '数字艺术' },
          { value: 'landscape', label: '风景' },
          { value: 'sketch', label: '素描' },
          { value: 'watercolor', label: '水彩' },
          { value: 'cyberpunk', label: '赛博朋克' },
          { value: 'pop_art', label: '波普艺术' }
        ],
        defaultValue: 'photograph'
      });
    }
  
    if ([
      'imagen-4.0-generate-001',
      'imagen-4.0-ultra-generate-001',
      'imagen-4.0-fast-generate-001',
      'imagen-3.0-generate-002',
      'imagen-3.0-generate-001', 
      'imagen-3.0-fast-generate-001',
      'imagegeneration@006'
    ].includes(modelName)) {
      configs.push({
        id: 'personGeneration',
        label: '是否允许生成人物/人脸',
        options: [
          { value: 'allow_all', label: '允许成人和儿童' },
          { value: 'allow_adult', label: '允许成人' },
          { value: 'dont_allow', label: '禁止生成' },
        ],
        defaultValue: 'allow_all'
      });
    }
  
    // enhancePrompt配置（仅适用于imagen-3.0-generate-002）
    if (modelName === 'imagen-3.0-generate-002') {
      configs.push({
        id: 'enhancePrompt',
        label: '使用Gemini增强提示词',
        options: [
          { value: true, label: '启用' },
          { value: false, label: '禁用' }
        ],
        defaultValue: true
      });
    }
    return configs;
};


export const ImageStyleAttributeData = [
  {
      id: 'primaryStyle',
      label: '主风格',
      options: [
        { value: 'photography', label: '摄影' },
        { value: 'drawing', label: '绘画' },
        { value: 'painting', label: '油画' },
        { value: 'digital art', label: '数字艺术' },
      ],
      required: false,
      type: 'select'
  },
  {
      id: 'photographyStyle',
      label: '摄影风格',
      options: [
        { value: 'landscape', label: '风景' },
        { value: 'studio', label: '工作室' },
        { value: 'portrait', label: '人像' },
        { value: 'candid', label: '抓拍' },
        { value: 'street', label: '街拍' },
        { value: 'architectural', label: '建筑' },
        { value: 'wildlife', label: '野生动物' },
        { value: 'photojournalism', label: '新闻摄影' },
        { value: 'fashion', label: '时尚' },
        { value: 'food', label: '美食' },
        { value: 'travel', label: '旅行' },
        {value: 'fine art', label: '艺术'},
        { value: 'polaroid', label: '宝丽来' },
        { value: 'astronomy', label: '天文' }
      ],
      parent: 'primaryStyle',
      parentValue: 'photography'
  },
  {
      id: 'drawingStyle',
      label: '绘画风格',
      options: [
        { value: 'technical pencil', label: '技术铅笔' },
        { value: 'color pencil', label: '彩色铅笔' },
        { value: 'cartoon', label: '卡通' },
        { value: 'graphic novel', label: '漫画小说' },
        { value: 'charcoal', label: '炭笔' },
        { value: 'pastel', label: '粉彩' },
        { value: 'ink', label: '墨水' },
        { value: 'sketch', label: '素描' },
        { value: 'doodle', label: '涂鸦' }
      ],
      parent: 'primaryStyle',
      parentValue: 'drawing'
  },
  {
      id: 'paintingStyle',
      label: '油画风格',
      options: [
        { value: 'gouache', label: '水粉画' },
        { value: 'oil', label: '油画' },
        { value: 'watercolor', label: '水彩' },
        { value: 'pastel', label: '粉彩' },
        { value: 'street art', label: '街头艺术' },
        { value: 'impressionism', label: '印象派' },
        { value: 'expressionism', label: '表现主义' },
        { value: 'surrealism', label: '超现实主义' },
        { value: 'abstract', label: '抽象' },
        { value: 'minimalism', label: '极简主义' }
      ],
      parent: 'primaryStyle',
      parentValue: 'painting'
  },
  {
      id: 'digitalArtStyle',
      label: '数字艺术风格',
      options: [
        { value: 'typography', label: '字体设计' },
        { value: 'digital illustration', label: '数字插画' },
        { value: 'pop art', label: 'POP艺术' },
        { value: 'cyberpunk poster', label: '赛博朋克海报' },
        { value: 'pixel art', label: '像素艺术' },
        { value: 'vector art', label: '矢量艺术' },
        { value: '3d rendering', label: '3D渲染' },
        { value: 'video game art', label: '游戏艺术' },
        { value: 'visual effects', label: '视觉特效' },
        { value: 'motion graphics', label: '动态图形' }
      ],
      parent: 'primaryStyle',
      parentValue: 'digital art'
  },
  {
      id: 'lighting',
      label: '光线',
      options: [
        { value: 'natural', label: '自然' },
        { value: 'bright sun', label: '明亮的太阳' },
        { value: 'golden hour', label: '黄金时段' },
        { value: 'night time', label: '夜间' },
        { value: 'dramatic', label: '戏剧化' },
        { value: 'warm', label: '暖色' },
        { value: 'cold', label: '冷色' },
      ]
  },
  {
      id: 'perspective',
      label: '视角',
      options: [
        { value: 'macro', label: '微距' },
        { value: 'close-up', label: '特写' },
        { value: 'standard', label: '标准' },
        { value: 'wide-angle', label: '广角' },
        { value: 'extra-wide', label: '超宽' },
        { value: 'aerial', label: '航空' },
      ]
  },
  {
      id: 'colors',
      label: '色彩',
      options: [
        { value: 'colorful', label: '彩色' },
        { value: 'light', label: '明亮' },
        { value: 'dark', label: '黑暗' },
        { value: 'black white', label: '黑白' },
        { value: 'vintage', label: '复古' },
        { value: 'cinematic grain', label: '电影' }
      ]
  },
  {
      id: 'specificUseCase',
      label: '特定用途',
      options: [
        { value: 'food,insects,plants(still life)', label: '食物、昆虫、植物（静物）' },
        { value: 'sports,wildlife(motion)', label: '运动、野生动物（动态）' },
        { value: 'astronomical,landscape(wide-angle)', label: '天文、风景（广角）' }
      ]
  },
  {
      id: 'lightOrigin',
      label: '光源位置',
      options: [
        { value: 'front', label: '前方' },
        { value: 'back', label: '后方' },
        { value: 'above', label: '上方' },
        { value: 'below', label: '下方' },
        { value: 'side', label: '侧面' }
      ]
  },
  {
      id: 'viewAngle',
      label: '观看角度',
      options: [
        { value: 'front', label: '正面' },
        { value: 'back', label: '背面' },
        { value: 'above', label: '俯视' },
        { value: 'below', label: '仰视' },
        { value: 'side', label: '侧面' }
      ]
  }
]

export const NanoBananaConfigs: GenerateConfig[] = [
  {
    id: 'aspectRatio',
    label: '图片宽高比',
    options: [
      { value: '1:1', label: '1:1' },
      { value: '3:2', label: '3:2' },
      { value: '2:3', label: '2:3' },
      { value: '4:3', label: '4:3' },
      { value: '3:4', label: '3:4' },
      { value: '4:5', label: '4:5' },
      { value: '5:4', label: '5:4' },
      { value: '9:16', label: '9:16' },
      { value: '16:9', label: '16:9' },
      { value: '21:9', label: '21:9' },
    ],
    defaultValue: '1:1'
  },
]