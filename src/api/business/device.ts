import { fetchRealDeviceList } from '@/api/modules/device'
import type { DeviceListFilters, Device } from '@/types'

/**
 * 🛠️ 智能业务层：获取设备表格数据
 */
export const getDeviceTableData = async (
    pageIndex: number,
    pageSize: number,
    filters: DeviceListFilters
): Promise<{ items: Device[], total: number }> => {
    try {
        const payload = {
            pageIndex,
            pageSize,
            country: filters.dataCenter || 'CN', // 必填，默认 CN
            uuid: filters.keyword || undefined,
        }

        console.log('🚀 [Business] Fetching Real Data:', payload)

        const res: any = await fetchRealDeviceList(payload)

        // 兼容处理：可能 request 拦截器返回了 data，也可能返回了完整 response
        let rawList: any[] = []
        let totalCount = 0

        // 尝试解析结构
        if (res && Array.isArray(res.Data)) {
            rawList = res.Data
            totalCount = res.TotalCount || 0
        } else if (res && typeof res === 'object' && (res.Success || res.success)) {
            // 某些特殊情况下可能的结构
            rawList = res.Data || res.data || []
            totalCount = res.TotalCount || res.totalCount || 0
        } else if (Array.isArray(res)) {
            rawList = res
            totalCount = res.length
        }

        // 数据映射 (PascalCase -> camelCase)
        const items = rawList.map((item: any) => {
            const get = (k1: string, k2: string) => item[k1] ?? item[k2] ?? null
            return {
                id: get('UUID', 'uuid'),
                uuid: get('UUID', 'uuid'),
                name: get('DeviceName', 'deviceName') || get('UUID', 'uuid'),
                productName: get('ProductName', 'productName') || '未知产品',
                productId: get('ProductId', 'productId'),
                status: mapDeviceStatus(item.OnlineStatus ?? item.onlineStatus),
                gmtActive: formatDateRaw(get('ActiveTime', 'activeTime')),
                gmtLastOnline: formatDateRaw(get('LastOnlineTime', 'lastOnlineTime')),
                region: get('Country', 'country'),
                _raw: item
            } as any as Device
        })

        return {
            items,
            total: totalCount || items.length
        }

    } catch (error) {
        console.error('❌ [Business] 获取设备列表失败:', error)
        return { items: [], total: 0 }
    }
}

function mapDeviceStatus(status: any): 'online' | 'offline' {
    if (String(status).toLowerCase() === 'online') return 'online'
    if (status === 1 || status === true) return 'online'
    return 'offline'
}

function formatDateRaw(dateStr: string | null): string {
    if (!dateStr) return '-'
    if (dateStr.includes('T')) return dateStr.replace('T', ' ').split('.')[0]
    return dateStr
}