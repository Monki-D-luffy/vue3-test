// src/ai/utils/promptUtils.ts

/**
 * 将任意对象数组转换为紧凑的 AI 可读字符串快照
 * 自动遍历所有字段，无需手动指定 Key
 */
export function generateAiSnapshot(data: any[], options: {
    excludeKeys?: string[],
    maxItems?: number
} = {}): string {
    const { excludeKeys = [], maxItems = 100 } = options;

    // 截取前 N 条
    const slice = data.slice(0, maxItems);

    if (slice.length === 0) {
        return 'No data available.';
    }

    return slice.map((item, index) => {
        // 提取属性并拼接
        const propsStr = Object.entries(item)
            .filter(([key, val]) => {
                // 过滤掉被排除的 Key、空值、或过于复杂的深层对象
                return !excludeKeys.includes(key) && val !== null && val !== undefined && typeof val !== 'function';
            })
            .map(([key, val]) => {
                // 如果值是对象，尝试简单的 JSON 序列化，否则直接转字符串
                const valStr = typeof val === 'object' ? JSON.stringify(val) : String(val);
                return `${key}:${valStr}`;
            })
            .join(' | '); // 使用管道符分隔属性，节省 token 且易读

        return `[${index + 1}] ${propsStr}`;
    }).join('\n');
}

/**
 * 智能提取对象的关键信息（用于详情页）
 */
export function generateObjectProfile(obj: any, excludeKeys: string[] = []): Record<string, any> {
    const result: any = {};
    if (!obj) return result;

    Object.keys(obj).forEach(key => {
        if (!excludeKeys.includes(key) && obj[key] != null) {
            result[key] = obj[key];
        }
    });
    return result;
}