import { fetchRealDeviceList } from '@/api/modules/device'
import request from '@/api/core/request'
import type { DeviceListFilters, Device } from '@/types'

export interface DeviceRealStats {
    total: number
    online: number
    offline: number
    active: number
}

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
            country: filters.dataCenter || 'CN',
            uuid: filters.keyword || undefined,
        }

        const res: any = await fetchRealDeviceList(payload)

        let rawList: any[] = []
        let totalCount = 0

        if (res && Array.isArray(res.Data)) {
            rawList = res.Data
            totalCount = res.TotalCount || 0
        } else if (res && typeof res === 'object' && (res.Success || res.success)) {
            rawList = res.Data || res.data || []
            totalCount = res.TotalCount || res.totalCount || 0
        } else if (Array.isArray(res)) {
            rawList = res
            totalCount = res.length
        }

        const items = rawList.map((item: any) => {
            // 辅助函数：按顺序尝试获取字段
            const get = (...keys: string[]) => {
                for (const k of keys) {
                    if (item[k] !== undefined && item[k] !== null) return item[k]
                }
                return null
            }

            return {
                id: get('UUID', 'uuid', 'Id', 'id'),
                uuid: get('UUID', 'uuid'),
                name: get('DeviceName', 'deviceName') || get('UUID', 'uuid')?.substring(0, 8) || 'Unknown Device',
                sn: get('UUID', 'uuid'),

                productName: get('ProductName', 'productName') || '未知产品',
                productId: get('ProductId', 'productId') || '-',

                status: mapDeviceStatus(item.OnlineStatus ?? item.onlineStatus),
                region: get('Country', 'country') || 'CN',

                // ✨ Fix: formatDateRaw 现在支持 undefined，修复 TS 报错
                gmtActive: formatDateRaw(get(
                    'createAt',
                    'ActiveTime', 'activeTime',
                    'BindTime', 'bindTime',
                    'CreateTime'
                )),

                gmtLastOnline: formatDateRaw(get(
                    'lastSeen',
                    'LastOnlineTime', 'lastOnlineTime',
                    'UpdateTime', 'updateTime'
                )),

                hasNewFirmware: false,
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

/**
 * 📊 统计数据获取
 */
export const getDeviceRealStats = async (country: string = 'CN'): Promise<DeviceRealStats> => {
    try {
        const totalReq = request.post('/manager/api/Devices/GetDevicesTotalCount', null, {
            params: { country }
        })

        const onlineReq = request.post('/manager/api/Devices/GetDevices', {
            pageIndex: 1,
            pageSize: 1,
            country,
            onlineStatus: 1
        })

        const [totalRes, onlineRes] = await Promise.all([totalReq, onlineReq])

        const total = Number(typeof totalRes.data === 'number' ? totalRes.data : (totalRes.data?.Data || 0))
        const onlineData = onlineRes.data as any
        const online = Number(onlineData?.TotalCount || onlineData?.totalCount || 0)

        return {
            total: total || 0,
            online: online || 0,
            offline: Math.max(0, (total || 0) - (online || 0)),
            active: total || 0
        }

    } catch (error) {
        console.warn('⚠️ [Business] 统计数据获取失败，降级为 0:', error)
        return { total: 0, online: 0, offline: 0, active: 0 }
    }
}

function mapDeviceStatus(status: any): 'online' | 'offline' {
    const s = String(status).toLowerCase()
    if (s === 'online' || s === '1' || s === 'true') return 'online'
    return 'offline'
}

// ✨ Fix: 允许 undefined，解决 "Type undefined is not assignable to type string"
function formatDateRaw(dateStr: string | null | undefined): string {
    if (!dateStr || typeof dateStr !== 'string') return '-'
    return dateStr.replace('T', ' ').split('.')[0]
}