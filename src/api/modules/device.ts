// src/api/modules/device.ts
import request from '@/api/core/request'
import type {
    Device,
    DeviceListFilters,
    PaginatedResponse,
    UpgradeTask,
    DeviceLogQueryParams
} from '@/types'

// ==========================================
// 🛠️ 类型定义
// ==========================================

export interface DeviceStatsResponse {
    country: string;
    totalCount: number;
    bindCount: number;
    onlineCount: number;
}

export interface DeviceRealStats {
    total: number;
    online: number;
    boundCount: number;
    activated: number;
}

interface RawDevice {
    UUID?: string;
    uuid?: string;
    Id?: string;
    id?: string;
    ProductName?: string;
    productName?: string;
    ProductId?: string;
    productId?: string;
    DeviceName?: string;
    deviceName?: string;
    Country?: string;
    country?: string;
    OnlineStatus?: boolean | string | number;
    onlineStatus?: boolean | string | number;
    BindStatus?: number;
    bindStatus?: number;
    ActiveTime?: string;
    activeTime?: string;
    LastOnlineTime?: string;
    lastOnlineTime?: string;
    UpdateTime?: string;
    updateTime?: string;
    FirmwareVersion?: string;
    firmwareVersion?: string;
    [key: string]: any;
}

// ==========================================
// 🧼 防腐层 (ACL)
// ==========================================

function transformDevice(item: RawDevice): Device {
    const get = (...keys: string[]) => {
        for (const k of keys) {
            if (item[k] !== undefined && item[k] !== null) return item[k]
        }
        return null
    }

    const mapStatus = (val: any): any => {
        const s = String(val).toLowerCase()
        return (s === 'online' || s === '1' || s === 'true') ? '在线' : '离线'
    }

    const fmtDate = (val: any): string => {
        if (!val || typeof val !== 'string') return '-'
        return val.replace('T', ' ').split('.')[0]
    }

    return {
        id: get('UUID', 'uuid', 'Id', 'id'),
        uuid: get('UUID', 'uuid'),
        name: get('DeviceName', 'deviceName') || get('UUID', 'uuid')?.substring(0, 8) || 'Unknown Device',
        sn: get('UUID', 'uuid'),
        productName: get('ProductName', 'productName') || '未知产品',
        productId: get('ProductId', 'productId') || '-',
        status: mapStatus(get('OnlineStatus', 'onlineStatus')),
        dataCenter: get('Country', 'country') || 'CN',
        firmwareVersion: get('FirmwareVersion', 'firmwareVersion') || '-',
        puuid: get('Puuid', 'puuid') || '-',
        isBound: get('BindStatus', 'bindStatus') === 1,
        gmtActive: fmtDate(get('ActiveTime', 'activeTime', 'BindTime', 'bindTime', 'CreateTime', 'createAt')),
        gmtLastOnline: fmtDate(get('LastOnlineTime', 'lastOnlineTime', 'UpdateTime', 'updateTime', 'lastSeen')),
        hasNewFirmware: false,
        // @ts-ignore
        _raw: item
    } as Device
}

// ==========================================
// 🚀 API 方法定义
// ==========================================

/**
 * 获取设备列表
 */
export const fetchDeviceList = async (
    pageIndex: number,
    pageSize: number,
    filters: DeviceListFilters
): Promise<PaginatedResponse<Device>> => {

    const keyword = filters.keyword || '';
    const isUUID = /^[0-9a-fA-F-]{36}$/.test(keyword);

    // 1. 智能区域回退
    let targetCountry = filters.dataCenter;
    if (!targetCountry && !isUUID) {
        targetCountry = 'CN';
    }

    // 2. 构建 Payload
    const payload: any = {
        pageIndex,
        pageSize,
        country: targetCountry || undefined,
        productId: filters.productId || undefined,
    }

    // 3. 映射绑定状态
    if (filters.isBound === 'true') {
        payload.bindStatus = 1;
    } else if (filters.isBound === 'false') {
        payload.bindStatus = 0;
    }

    // 4. 映射日期范围
    if (Array.isArray(filters.dateRange) && filters.dateRange.length === 2) {
        payload.startTime = filters.dateRange[0] + ' 00:00:00';
        payload.endTime = filters.dateRange[1] + ' 23:59:59';
    }

    // 5. 关键词映射
    if (keyword) {
        if (isUUID) {
            payload.uuid = keyword;
        } else {
            payload.deviceName = keyword;
        }
    }

    try {
        // ✨ Fix: 使用 /api/Devices/...，通过 Vite 转发
        const res = await request.post<any>('/api/Devices/GetDevices', payload)

        let rawList: RawDevice[] = []
        let total = 0

        // 兼容各种返回解构
        if (res && Array.isArray(res.Data)) {
            rawList = res.Data
            total = res.TotalCount || 0
        } else if (Array.isArray(res)) {
            rawList = res
            total = res.length
        } else if (res && res.data) {
            rawList = Array.isArray(res.data) ? res.data : []
            total = res.total || rawList.length
        }

        const items = rawList.map(transformDevice)
        return { items, total }

    } catch (error) {
        console.error('❌ Fetch Device List Failed:', error)
        return { items: [], total: 0 }
    }
}

export const fetchDevices = fetchDeviceList;

/**
 * 获取设备统计数据
 */
export const fetchDeviceStats = async (country?: string): Promise<DeviceRealStats> => {
    const effectiveCountry = country || 'CN';

    try {
        const res = await request.post<any>(
            '/api/Devices/GetDevicesTotalCount', // ✨ Fix: /api/...
            null,
            {
                params: { country: effectiveCountry }
            }
        );

        const statsData = (res?.data || res || {}) as DeviceStatsResponse;

        console.log('📊 Real Stats Response:', statsData);

        return {
            total: Number(statsData.totalCount || 0),
            online: Number(statsData.onlineCount || 0),
            boundCount: Number(statsData.bindCount || 0),
            activated: Number(statsData.totalCount || 0)
        }
    } catch (error) {
        console.error('⚠️ Fetch Device Stats Failed:', error)
        return { total: 0, online: 0, boundCount: 0, activated: 0 }
    }
}

/**
 * 获取设备详情
 */
export const fetchDeviceDetail = (id: string) => {
    return request.post<any>('/api/Devices/GetDevices', {
        pageIndex: 1,
        pageSize: 1,
        uuid: id
    }).then(res => {
        const list = res.Data || []
        if (list.length > 0) return transformDevice(list[0])
        throw new Error('Device not found')
    })
}

/**
 * 删除设备
 */
export const deleteDevice = (id: string) => {
    return request.post<void>('/api/Devices/DeleteDevice', null, { params: { uuid: id } })
}

const LOG_API = {
    GET_LIST: '/api/DeviceLogs/GetDeviceLogs', // ✨ Fix
    GET_COUNT: '/api/DeviceLogs/GetDeviceLogsTotalCount' // ✨ Fix
}

export const fetchDeviceLogs = async (params: DeviceLogQueryParams): Promise<PaginatedResponse<any>> => {
    const commonParams = {
        uuid: params.deviceId,
        dpid: params.eventId ? Number(params.eventId) : null,
        startTime: params.startTime,
        endTime: params.endTime
    }
    const listPayload = { ...commonParams, pageIndex: params.pageIndex || 1, pageSize: params.pageSize || 20 }

    try {
        const [listRes, countRes] = await Promise.all([
            request.post<any>(LOG_API.GET_LIST, listPayload),
            request.post<any>(LOG_API.GET_COUNT, commonParams)
        ])
        const listBody = listRes.data || listRes || {};
        const rawList = Array.isArray(listBody) ? listBody : (Array.isArray(listBody.Data) ? listBody.Data : []);

        let total = 0;
        const countBody = countRes.data || countRes;
        if (typeof countBody === 'number') total = countBody;
        else if (countBody?.Data) total = Number(countBody.Data);

        const items = rawList.map((log: any) => ({
            time: log.createdAt || log.CreateTime || new Date().toISOString(),
            event: log.dpid ? `DPID: ${log.dpid}` : (log.eventName || 'Report'),
            type: (log.type === 'error' ? 'danger' : (log.type === 'warn' ? 'warning' : 'info')),
            details: typeof log.dpValue === 'object' ? JSON.stringify(log.dpValue) : String(log.dpValue || log.LogContent || ''),
            source: String(log.source || 'Device'),
            sourceDetail: log.remark || '-'
        }))
        return { items, total: total || 0 }
    } catch (error) {
        return { items: [], total: 0 }
    }
}

export const startDeviceUpgrade = (deviceId: string) => request.post<UpgradeTask>('/devices/upgrade', { deviceId })
export const getUpgradeTaskStatus = (taskId: string) => request.get<UpgradeTask>(`/upgrade-task/${taskId}`)