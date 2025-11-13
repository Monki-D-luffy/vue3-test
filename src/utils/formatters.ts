// src/utils/formatters.ts

/**
 * 格式化日期时间字符串 (YYYY-MM-DD HH:mm:ss)
 */
export const formatDateTime = (dateString: string | Date | number | null | undefined): string => {
    if (!dateString) return ''
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''

    const pad = (num: number) => num.toString().padStart(2, '0')

    const Y = date.getFullYear()
    const M = pad(date.getMonth() + 1)
    const D = pad(date.getDate())
    const h = pad(date.getHours())
    const m = pad(date.getMinutes())
    const s = pad(date.getSeconds())

    return `${Y}-${M}-${D} ${h}:${m}:${s}`
}

/**
 * ✨ [修复] 格式化日期 (YYYY-MM-DD) - 尊重本地时区
 * 用于查询参数构建，避免 toISOString() 导致的跨天问题
 */
export const formatDate = (dateInput: Date | string | number | null | undefined): string => {
    if (!dateInput) return ''
    const date = new Date(dateInput)
    if (isNaN(date.getTime())) return ''

    const pad = (num: number) => num.toString().padStart(2, '0')

    const Y = date.getFullYear()
    const M = pad(date.getMonth() + 1)
    const D = pad(date.getDate())

    return `${Y}-${M}-${D}`
}

/**
 * 根据设备状态返回 Element Plus 的 Tag 类型
 */
export const getDeviceStatusType = (status: string): string => {
    const map: Record<string, string> = {
        '在线': 'success',
        '离线': 'info',
        '故障': 'danger',
        '未激活': 'warning',
        '升级中': 'primary' // 补充升级中状态
    }
    return map[status] || ''
}

/**
 * 格式化文件大小 (Bytes -> KB/MB)
 */
export const formatFileSize = (bytes: number | undefined): string => {
    if (bytes === undefined || bytes === null || isNaN(bytes)) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 获取固件验证状态的 Tag 颜色
 */
export const getFirmwareVerifiedStatus = (verified?: boolean) => {
    return verified
        ? { label: '已验证', type: 'success' }
        : { label: '未验证', type: 'warning' }
}