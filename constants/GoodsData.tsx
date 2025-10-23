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
                prompt: '一个逼真的，极简主义的工作室拍摄，几个灰白色的，有机形状的岩石基座和平台被安排在光滑的，哑光的米色表面上，与之相匹配的普通墙壁背景。柔和的、漫射的自然光从左上角投射在墙壁和表面上，投射出微妙的、细长的阴影。在右边，一小簇黄色中心的白色雏菊插在一个圆形的米白色花瓶里。调色板是柔和的，主要由温暖的奶油色、米色和米白色组成。纹理在石头上自然粗糙不规则，在背景上光滑，在花朵上细腻。整体氛围是宁静、干净、宁静的。'
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
                prompt: '不规则的、淡奶油色的、哑光的平台从浅的、静止的、浅蓝绿色的水中浮现出来。两个小的，脊状的贝壳或者螺放在前景和背景平台上。商品放置在前景的平台上，柔和的日光投射出柔和的阴影，突出光滑的纹理。调色板是柔和的温暖中性的奶油色，米色，米白色和冷蓝绿色。心情是宁静的，宁静的，像一个温泉。'
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
                prompt: '一个精美复杂的3D立体纸雕塑，由蝴蝶和花朵构成一个拱形画框。整个雕塑完全由白色纸张制成，展示了多层次的剪纸艺术。画框内有精细的蝴蝶、雏菊和缠绕的藤蔓。整个作品放置在一个纯白色的方形底座上，商品放在方形底座上作品的前方，突出商品，画框中心被温暖的金色光芒从内部柔和地照亮，其中嵌入了微小的仙女灯，营造出神奇的氛围。背景是无缝的、纯净的浅灰色影棚背景。采用柔和的漫射光，产品摄影风格，干净的美学，梦幻而优雅。'
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
                prompt: '商品放置在木质底座上，以现代极简主义的展示空间为背景，优雅的灯光，柔和的阴影，灰色的色调'
            },
            {
                key: 'displayWindow-8',
                name: '夏日展台',
                image: '/GoodsSenceImages/夏日展台.webp',
                prompt: '摆放在两个几何黄色基座上，设计现代简约，绿色的棕榈叶从左侧延伸，为构图的清新夏日氛围增添了一丝热带风味。背景是宁静的蓝天，柔和的自然光照亮产品，增强了明亮的色彩。'
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
            // {
            //     key: 'displayWindow-13',
            //     name: '梦幻溪流',
            //     image: '/GoodsSenceImages/梦幻溪流.webp',
            //     prompt: '一个电影般的，逼真的微距镜头，优雅的紫色番红花与充满活力的绿叶，休息在一个完美的静止，镜子般的水面，创造一个完美的对称反射。背景笼罩在柔和、发光、空灵的紫色和薰衣草雾中，由戏剧性的背光和柔和的体积光照亮。整体情绪是神秘的，宁静的，宁静的，渲染在超高的细节与丰富的调色板，8K分辨率。'
            // },
            {
                key: 'displayWindow-14',
                name: '绮丽幻境',
                image: '/GoodsSenceImages/绮丽幻境.webp',
                prompt: '一幅用于产品展示的3D渲染场景：一个由粗糙岩石或大理石制成的圆形底座/展台，空置着，位于画面的前景中央。展台被平静清澈的浅蓝色水面环绕，水中有柔和的倒影。背景和两侧是美丽的粉色珊瑚礁，形态有机而优美。更远的背景是柔和的浅蓝色天空，点缀着几朵稀疏的白云。整个场景光线明亮、柔和，色彩饱和度适中，营造出一种宁静、干净、梦幻般的夏日氛围。'
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
                prompt: '一个节日的宠物派对背景，许多光滑的、柔和的彩色超大球体和散落的彩带，他们在一个干净的米白色表面上，环绕出一个展示前景空间，对着普通的暖白色墙壁，顶部是一个柔和的三角形彩色横幅。柔和的室内光线创造出微妙的阴影和散景。突出庆祝和喜悦，柔和的环境光，温暖柔和的色调，俏皮。'
            },
            {
                key: 'festivalAtmosphere-2',
                name: '可爱粘土',
                image: '/GoodsSenceImages/可爱粘土.webp',
                // prompt: '树枝上的粉红色花朵，极简的粘土风格，自然的色彩，自然的形状，简单的景观，大岩石，粘土风格的植物，卡通，高分辨率，C4D，辛烷值，明亮的色调，商业摄影，产品放置在大岩石之间。'
                prompt: '一个宁静的沙漠景观，光滑、圆润、浅褐色的岩石在细沙地上。一个巨大的椭圆形岩石突出地出现在眼前的前景中，稍微偏离中心。模糊的绿色多肉植物框架的底部和侧面的场景。在中景和背景中，在明亮、弥漫的日光下，高大的柱状仙人掌矗立在柔和模糊的沙漠山丘旁。调色板以暖色调的棕褐色、棕色和各种深浅的绿色为主，用光滑的岩石纹理传达出平静而极简的氛围，整体为粘土风格。'
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
                prompt: '石台上，底色翠松绿色，松针、松枝、松果，青苔环绕。'
            },

        ]
    },
    {
        key: 'naturalLandscape',
        name: '自然景观',
        children: [
            {
                key: 'naturalLandscape-1',
                name: '户外营地',
                image: '/GoodsSenceImages/户外营地.webp',
                prompt: '在户外露营场景中，商品放置在崎岖的、有纹理的岩石上。柔和、自然的阳光照射进来，背景是在郁郁葱葱的绿树间搭起浅色的帐篷，为营地增添了宁静和冒险的感觉，整体色调中带着一丝温暖。设计风格兼具实用与现代优雅，非常适合户外运动爱好者。'
            },
            {
                key: 'naturalLandscape-2',
                name: '沙滩贝壳',
                image: '/GoodsSenceImages/沙滩贝壳.webp',
                prompt: '黄金时间，阳光亲吻的沙滩的高度详细，逼真的特写。前景的特点是细纹理，波纹浅米色的沙子，有几个小的，白色的贝壳和海螺散落周围。背景是柔和的模糊，展现了平静的蓝绿色海洋和温暖的金橙色天空。柔和的阳光投射出柔和的阴影，营造出宁静祥和的氛围。'
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


