import { ImageStyleAttributeData } from '@/constants/ImagenData';
import { VideoStyleAttributeData } from '@/constants/VeoData';
import { AttributeGroup } from '@/types/BaseType'


// 动态提示词映射生成器
export class PromptMappingGenerator {
    private attributeData: AttributeGroup[];
    private generateType: string;

    constructor(generateType: string) {
        this.generateType = generateType;
        if (generateType === 'image') {
            this.attributeData = ImageStyleAttributeData as AttributeGroup[];
        } else {
            this.attributeData = VideoStyleAttributeData as AttributeGroup[];
        }
    }
  
    // 根据属性数据动态生成映射表
    public generateMappings() {
        const mappings: Record<string, Record<string, string>> = {};

        for (const group of this.attributeData) {
            if (group.id === 'primaryStyle') {
                continue;
            } else {
                const groupMappings: Record<string, string> = {};
                for (const option of group.options) {
                    if (group.parent === 'primaryStyle') {
                        groupMappings[option.value] = `A ${option.value} ${group.parentValue} ${this.generateType} of`
                    } else if (group.id === 'colors') {
                        groupMappings[option.value] = `${option.value} colors`;
                    } else {
                        groupMappings[option.value] = `${option.value} of ${group.id.replace(/([A-Z])/g, ' $1').toLowerCase().trim()}`;
                    }
                }
                mappings[group.id] = groupMappings;
            }
        }
        
        return mappings;
    }
  
}


export function GenerateStylePrompt(
    selectedAttributes: Record<string, string>, 
    userPrompt: string,
    generateType: string = 'image',
): string {
    const mappings = new PromptMappingGenerator(generateType).generateMappings();
    let PrefixPrompt = '';
    let AdditionalPrompt: string[] = [];

    Object.entries(selectedAttributes).forEach(
        ([attrKey, attrValue]) => {
            if (mappings?.[attrKey]?.[attrValue]) {
                const mappingAttrValue = mappings[attrKey][attrValue];
                if (mappingAttrValue.startsWith('A ') && mappingAttrValue.endsWith(' of')) {
                    PrefixPrompt = PrefixPrompt + mappingAttrValue;
                } else {
                    AdditionalPrompt.push(mappingAttrValue);
                }
            }
        }
    )

    let finalPrompt = `${PrefixPrompt} ${userPrompt}.`
    if (AdditionalPrompt.length > 0) {
        finalPrompt = finalPrompt + '\nWith the following styles:\n' + AdditionalPrompt.join(', ').replace(/^\w/, c => c.toUpperCase())
    }
    return finalPrompt
}

// 获取属性组的显示条件
export function getAttributeVisibility(
  attributeGroups: any[], 
  selectedAttributes: Record<string, string>
): any[] {
  return attributeGroups.filter(group => {
    // 如果没有父级依赖，直接显示
    if (!group.parent || !group.parentValue) {
      return true;
    }
    // 如果有父级依赖，检查父级是否选中了对应的值
    return selectedAttributes[group.parent] === group.parentValue;
  });
}
