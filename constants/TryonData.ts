export  const TryOnConfigs = [
    {
      id: 'personGeneration',
      label: '是否允许模型生成人物/人脸',
      options: [
          { value: 'allow_all', label: '允许成人和儿童' },
          { value: 'allow_adult', label: '允许成人' },
          { value: 'dont_allow', label: '禁止生成' },
      ],
      defaultValue: 'allow_all'
    },
    {
      id: 'sampleCount',
      label: '生成图片数量',
      options: [
        { value: 1, label: '1张' },
        { value: 2, label: '2张' },
        { value: 3, label: '3张' },
        { value: 4, label: '4张' }
      ],
      defaultValue: 1
    },
    {
      id: 'enhancePrompt',
      label: '使用Gemini优化提示词',
      options: [
        { value: true, label: '是' },
        { value: false, label: '否' }
      ],
      defaultValue: true
    },
];

export const ProductRecontextConfigs = [
    {
      id: 'sampleCount',
      label: '生成图片数量',
      options: [
        { value: 1, label: '1张' },
        { value: 2, label: '2张' },
        { value: 3, label: '3张' },
        { value: 4, label: '4张' }
      ],
      defaultValue: 1
    },
    {
        id: 'personGeneration',
        label: '是否允许模型生成人物/人脸',
        options: [
            { value: 'allow_all', label: '允许成人和儿童' },
            { value: 'allow_adult', label: '允许成人' },
            { value: 'dont_allow', label: '禁止生成' },
        ],
        defaultValue: 'allow_all'
    },
];

export const TryonModelOptions = [
    {
        label: 'Try On',
        value: 'virtual-try-on-preview-08-04',
    },
]
export const ProductRecontextModelOptions = [
    {
        label: 'Product Recontext',
        value: 'imagen-product-recontext-preview-06-30',
    },
]

export const TryonModelList = TryonModelOptions.map((item) => item.value);
