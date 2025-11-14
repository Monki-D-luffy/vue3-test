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
 * 格式化日期 (YYYY-MM-DD)
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
 * ✨ [新增] 相对时间格式化 (例如：2小时前)
 */
export const formatTimeAgo = (dateInput: string | Date | number): string => {
    if (!dateInput) return '--'
    const date = new Date(dateInput)
    const now = new Date()
    const diff = (now.getTime() - date.getTime()) / 1000 // 秒数

    if (diff < 60) return '刚刚'
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
    if (diff < 604800) return `${Math.floor(diff / 86400)}天前`

    // 超过一周直接显示日期
    return formatDate(date)
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
        '升级中': 'primary'
    }
    return map[status] || ''
}