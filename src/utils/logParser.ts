// src/utils/logParser.ts
import { formatDateTime } from './formatters'

/**
 * (内部辅助函数) 尝试将原始详情解析为对象
 * 原始数据可能是 JSON 字符串，也可能已经是对象
 */
function tryParseDetails(rawDetails: any): Record<string, any> | null {
    if (typeof rawDetails === 'object' && rawDetails !== null) {
        return rawDetails // 已经是对象
    }
    if (typeof rawDetails === 'string') {
        try {
            return JSON.parse(rawDetails)
        } catch (e) {
            return null // 无法解析的字符串
        }
    }
    return null // 其他无效类型
}

/**
 * 主函数：解析设备日志的 'details' 字段
 * @param rawDetails 来自 API 的原始 'details' 字段
 * @returns 人类可读的字符串
 */
export const parseLogDetails = (rawDetails: any): string => {
    const details = tryParseDetails(rawDetails)

    // 如果无法解析，返回原始（或格式化）的字符串
    if (!details) {
        if (typeof rawDetails === 'string' && rawDetails.length > 50) {
            return `${rawDetails.substring(0, 50)}...`; // 截断过长的原始字符串
        }
        return String(rawDetails);
    }

    // --- 在这里添加你的自定义解析逻辑 ---
    // 这是你“随意修改”的地方

    // 示例：根据 'type' 字段使用 switch
    switch (details.type) {
        case 1:
            // 假设 type 1 是温度上报
            return `[属性上报] 温度: ${details.v}°C (时间: ${formatDateTime(new Date(Number(details.ts) * 1000))})`

        case 2:
            // 假设 type 2 是固件升级
            return `[OTA事件] 升级到版本 ${details.version}。状态: ${details.status === 0 ? '成功' : '失败'}`

        case 'CONFIG_UPDATE':
            // 假设是配置更新
            return `[配置更新] ${details.key} 已更新。`

        default:
            // 默认回退：将 JSON 格式化显示 (用于开发调试)
            return JSON.stringify(details, null, 2)
    }
}