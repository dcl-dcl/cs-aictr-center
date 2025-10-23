import { NanoBananaConfigs } from './ImagenData';

export const GoodsGenImageModel = 'gemini-2.5-flash-image'

export const AspectRatioOptions = NanoBananaConfigs.find((item) => item.id === 'aspectRatio')?.options || [];

export const LightingOptions = [
    { label: '左光源', value: 'left', prompt: '左光源' },
    { label: '右光源', value: 'right', prompt: '右光源' },
    { label: '顶光源', value: 'top', prompt: '顶光源' },
    { label: '底光源', value: 'bottom', prompt: '底光源' },
    { label: '左上光源', value: 'top-left', prompt: '左上光源' },
    { label: '右上光源', value: 'top-right', prompt: '右上光源' },
    { label: '左下光源', value: 'bottom-left', prompt: '左下光源' },
    { label: '右下光源', value: 'bottom-right', prompt: '右下光源' }
];

export const recommendedScenesTabs = [
    {
        key: 'displayWindow',
        name: '展台橱窗',
        children: [
            {
                key: 'displayWindow-1',
                name: '淡雅幽幽',
                image: '/GoodsSenceImages/淡雅幽幽.webp',
                prompt: '艺术平衡在三个光滑的白色宝石，它创造了稳定和简单的感觉。背景是温暖的米色，与整体色调相辅相成，增强了酒瓶的优雅。精致的干花补充了中性色调，并巧妙地放置在宝石附近，增加了自然的触感。柔和的漫射光营造出宁静的氛围，强调构图的奢华沉稳的设计风格。'
            },
            {
                key: 'displayWindow-2',
                name: '白石小品',
                image: '/GoodsSenceImages/白石小品.webp',
                prompt: '一组有纹理的白色石头结构上，与柔和的色调形成鲜明的对比。它们被精致的绿色和紫色多肉植物所包围，为极简主义的设计增添了一种有机的感觉。灯光柔和弥漫，投射出柔和的阴影，突出石材光滑的质感，丰富了整体的精致和现代美学。'
            },
            {
                key: 'displayWindow-3',
                name: '水上漂浮',
                image: '/GoodsSenceImages/水上漂浮.webp',
                prompt: '光滑的浅色石桌上，四周是反射的水。在瓶身旁边放置一个精致的贝壳，增添了自然的气息。背景以柔和的米色和灰白色为主色调，类似于阳光明媚的海滩和古老的石头建筑，营造出温暖、宁静的氛围。柔和的灯光增强了色彩的柔和。'
            },
            {
                key: 'displayWindow-4',
                name: '古木逢春',
                image: '/GoodsSenceImages/古木逢春.webp',
                prompt: '在有纹理的腐木表面，旁边是一棵枝繁叶茂的精致盆景树，营造出一种宁静的氛围。背景柔和而模糊，在闪闪发光、斑驳的表面上呈现出郁郁葱葱的绿色植物。整体色调柔和自然，光影和谐交织，强调构图的简洁美。'
            },
            {
                key: 'displayWindow-5',
                name: '纸艺花丛',
                image: '/GoodsSenceImages/纸艺花丛.webp',
                prompt: '产品摄影，白色展台，背景是3d剪纸花和蝴蝶，藤蔓，舞台设计，背景发光的白色，明亮的空间，背景是白色，在动画形状的风格，轻白色，童趣的抽象，渲染在cinema4d，可爱和梦幻；'
            },
            {
                key: 'displayWindow-6',
                name: '明亮木台',
                image: '/GoodsSenceImages/明亮木台.webp',
                prompt: '摆放在木桌上，以极简的讲台为背景，方形和台阶，大气优雅，灯光柔和，色调明亮'
            },
            {
                key: 'displayWindow-7',
                name: '尚木灰简',
                image: '/GoodsSenceImages/尚木灰简.webp',
                prompt: '在木质底座上，以现代极简主义的展示空间为背景，优雅的灯光，柔和的阴影，灰色的色调'
            },
            {
                key: 'displayWindow-8',
                name: '夏日展台',
                image: '/GoodsSenceImages/夏日展台.webp',
                prompt: '在两个几何黄色基座上，设计现代简约，绿色的棕榈叶从左侧延伸，为构图的清新夏日氛围增添了一丝热带风味。背景是宁静的蓝天，柔和的自然光照亮产品，增强了明亮的色彩。'
            },
            {
                key: 'displayWindow-9',
                name: '蓝调空间',
                image: '/GoodsSenceImages/蓝调空间.webp',
                prompt: '在光滑的浅蓝色方形底座上，极简主义的讲台，球体和圆盘为背景，未来感，蓝色灯光，浅蓝色色调。'
            },
            {
                key: 'displayWindow-10',
                name: '圆方白台',
                image: '/GoodsSenceImages/圆方白台.webp',
                prompt: '在白色大理石基座上，以极简主义的讲台为背景，球体和台阶，清新的氛围，柔和的灯光，白色的色调。'
            },
            {
                key: 'displayWindow-11',
                name: '白色背景',
                image: '/GoodsSenceImages/白色背景.webp',
                prompt: '白色、摄影空间'
            },
            {
                key: 'displayWindow-12',
                name: '灰色背景',
                image: '/GoodsSenceImages/灰色背景.webp',
                prompt: '灰色、摄影空间'
            },
        ]
    },
    {
        key: 'festivalAtmosphere',
        name: '节日氛围',
        children: [
            {
                key: 'festivalAtmosphere-1',
                name: '宠物派对',
                image: '/GoodsSenceImages/宠物派对.webp',
                prompt: '一个节日的宠物生日派对背景与彩色气球和彩带在光滑的白色地板上，突出庆祝和喜悦，柔和的环境光，温暖柔和的色调，俏皮。'
            },
            {
                key: 'festivalAtmosphere-2',
                name: '可爱粘土',
                image: '/GoodsSenceImages/可爱粘土.webp',
                prompt: '树枝上的粉红色花朵，极简的粘土风格，自然的色彩，自然的形状，简单的景观，大岩石，粘土风格的植物，卡通，高分辨率，C4D，辛烷值，明亮的色调，商业摄影，产品放置在大岩石之间。'
            },
            {
                key: 'festivalAtmosphere-3',
                name: '春花绿意',
                image: '/GoodsSenceImages/春花绿意.webp',
                prompt: '柔光的丝绸上，郁郁葱葱的绿叶和精致的白花环绕，营造出一种自然宁静的氛围。背景被柔和地模糊了，斑驳的阳光穿过树木，增强了温暖和诱人的色调。整体设计散发着简单有机的美，强调产品展示的纯粹与宁静。'
            },
            {
                key: 'festivalAtmosphere-4',
                name: '绿意松针',
                image: '/GoodsSenceImages/绿意松针.webp',
                prompt: '石台上，底色墨绿色，松针、松枝，青苔环绕'
            },

        ]
    },
    {
        key: 'naturalLandscape',
        name: '自然景观',
        children: [
            {
                key: 'luxury',
                name: '奢侈艺术',
                color: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                prompt: '奢侈艺术'
            },
            {
                key: 'dreamy',
                name: '梦幻紫幻',
                color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                prompt: '梦幻紫幻'
            }
        ]
    },
    {
        key: 'indoorSpace',
        name: '室内空间',
        children: [
            {
                key: 'luxury',
                name: '奢侈艺术',
                color: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                prompt: '奢侈艺术'
            },
            {
                key: 'dreamy',
                name: '梦幻紫幻',
                color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                prompt: '梦幻紫幻'
            }
        ]
    },
    // {
    //     key: 'abstractConcept',
    //     name: '抽象概念',
    //     children: [
    //         {
    //             key: 'luxury',
    //             name: '奢侈艺术',
    //             color: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    //             prompt: '奢侈艺术'
    //         },
    //         {
    //             key: 'dreamy',
    //             name: '梦幻紫幻',
    //             color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    //             prompt: '梦幻紫幻'
    //         }
    //     ]
    // },
];

export const productExamples = [
{
    key: 'example-3',
    name: '鱼油',
    image: '/GoodsExamples/Fish-oil.png',
},
{
    key: 'example-2',
    name: '小熊',
    image: '/GoodsExamples/Bear.png',
},
{
    key: 'example-5',
    name: '红酒',
    image: '/GoodsExamples/Wine.png',
},
{
    key: 'example-4',
    name: '洗发水',
    image: '/GoodsExamples/Shampoo.png',
},
{
    key: 'example-6',
    name: '饮料',
    image: '/GoodsExamples/orange-juice.png',
},
{
    key: 'example-1',
    name: '香水',
    image: '/GoodsExamples/Perfume.png',
},
];


