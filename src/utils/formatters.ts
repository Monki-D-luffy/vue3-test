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