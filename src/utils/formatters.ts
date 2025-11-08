/**
 * 格式化日期时间字符串
 * @param dateString 任何有效的日期输入
 * @returns 格式化的字符串 'YYYY-MM-DD HH:mm:ss' 或 ''
 */
export const formatDateTime = (dateString: string | Date | null | undefined): string => {
    if (!dateString) return ''

    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '' // 处理无效日期

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
 * (✨ 新增)
 * 根据设备状态返回 Element Plus 的 Tag 类型
 * @param status 设备状态 (如 '在线', '离线')
 * @returns 对应的 'type' (如 'success', 'info')
 */
export const getDeviceStatusType = (status: string): string => {
    const map: Record<string, string> = {
        '在线': 'success',
        '离线': 'info',
        '故障': 'danger',
        '未激活': 'warning'
    }
    return map[status] || 'default' // 使用 'default' 作为备用
}