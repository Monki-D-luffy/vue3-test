/**
 * src/utils/dpParser.ts
 * 设备 DP (Data Point) 解析核心逻辑库
 * 用于将晦涩的原始值转换为人类可读的内容
 */

interface ParsedResult {
    label?: string; // 字段含义
    value: any;     // 解析后的值
    unit?: string;  // 单位
    desc?: string;  // 额外描述
}

/**
 * 通用解析入口
 * @param dpid 事件ID或DPID (可能是数字或字符串 "DPID: 22")
 * @param rawValue 原始报文 (可能是 JSON 字符串、对象或普通字符串)
 */
export const parseDpData = (dpid: string | number | undefined, rawValue: any): any => {
    // 1. 预处理：尝试将 JSON 字符串转为对象，方便后续处理
    let val = rawValue;
    try {
        if (typeof rawValue === 'string' && (rawValue.startsWith('{') || rawValue.startsWith('['))) {
            val = JSON.parse(rawValue);
        }
    } catch (e) {
        // 解析失败则保持原样
    }

    // 2. 提取纯数字 ID (例如把 "DPID: 22" 变成 "22")
    const id = String(dpid || '').replace(/\D/g, '');

    // =========================================================
    // 👇 在这里配置您的解析规则 (根据后端接口文件或协议文档)
    // =========================================================

    switch (id) {
        case '22': // 固件版本
            return {
                label: '固件版本',
                value: typeof val === 'string' ? val.replace(/"/g, '') : val,
                desc: '设备当前运行的 MCU/固件版本号'
            };

        case '1': // 示例：开关
            return {
                label: '开关状态',
                value: val ? '开启 (ON)' : '关闭 (OFF)',
                desc: '设备主电源状态'
            };

        case '20': // 示例：电量
            return {
                label: '剩余电量',
                value: val,
                unit: '%'
            };

        // ... 在这里添加更多 case ...

        default:
            // 没有匹配到规则，如果是对象，就美化一下；如果是简单值，直接返回
            return val;
    }
};

/**
 * 辅助：判断是否解析出了有意义的结构
 */
export const isParsedStructure = (data: any): boolean => {
    return data && typeof data === 'object' && ('label' in data || 'desc' in data);
}