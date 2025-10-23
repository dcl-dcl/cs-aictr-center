export const getField = (field: string | string[] | undefined) => 
    Array.isArray(field) ? field[0] : field;


export function transformParameters<T extends object>(
    params: Record<string, any>
  ): T {
    // 使用 Object.entries 和 reduce 来创建一个新的、类型正确的对象
    const result = Object.entries(params).reduce((acc, [key, value]) => {
      let processedValue: any = value;
  
      if (typeof value === 'string') {
        if (value.toLowerCase() === 'true') {
          processedValue = true;
        } else if (value.toLowerCase() === 'false') {
          processedValue = false;
        }
        else if (value.trim() !== '' && !isNaN(Number(value))) {
          processedValue = Number(value);
        }
      }

      (acc as any)[key] = processedValue;
      return acc;
    }, {} as T);
  
    return result;
}

export function getTaskId(): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // yyyy-mm-dd
    const timestamp = now.getTime();
    const randomNum = Math.floor(Math.random() * 9000) + 1000;
    
    return `${dateStr}-${timestamp}-${randomNum}`;
};
