// src/api/modules/device.ts
import request from '@/api/core/request'
import type {
    Device,
    DeviceListFilters,
    PaginatedResponse,
    DeviceSummary,
    UpgradeTask,
    DeviceLogQueryParams
} from '@/types'

// ==========================================
// 🛠️ 类型定义 (Module Specific)
// ==========================================

// ✨ Fix: 对齐 DeviceSummary 接口，使用 activated 而非 active
export interface DeviceRealStats {
    total: number;
    online: number;
    offline: number;
    activated: number; // Fixed name
}

// 后端原始数据类型 (用于类型提示)
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
// 🧼 防腐层 (ACL) - 数据清洗
// ==========================================

/**
 * 核心清洗函数：将后端混乱的 PascalCase/MixedCase 转换为标准前端模型
 */
function transformDevice(item: RawDevice): Device {
    // 辅助工具：按优先级获取字段值
    const get = (...keys: string[]) => {
        for (const k of keys) {
            if (item[k] !== undefined && item[k] !== null) return item[k]
        }
        return null
    }

    // 状态归一化
    const mapStatus = (val: any): any => {
        const s = String(val).toLowerCase()
        return (s === 'online' || s === '1' || s === 'true') ? '在线' : '离线'
    }

    // 时间格式化
    const fmtDate = (val: any): string => {
        if (!val || typeof val !== 'string') return '-'
        return val.replace('T', ' ').split('.')[0]
    }

    // ✨ Fix: 严格按照 src/types/index.ts 的 Device 接口构造
    return {
        id: get('UUID', 'uuid', 'Id', 'id'),
        uuid: get('UUID', 'uuid'), // 注意: Device 接口可能没有定义 uuid，如果报错请检查 types，通常 id=uuid

        name: get('DeviceName', 'deviceName') || get('UUID', 'uuid')?.substring(0, 8) || 'Unknown Device',
        sn: get('UUID', 'uuid'),

        productName: get('ProductName', 'productName') || '未知产品',
        productId: get('ProductId', 'productId') || '-',

        status: mapStatus(get('OnlineStatus', 'onlineStatus')),

        // ✨ Fix: 映射 Country -> dataCenter
        dataCenter: get('Country', 'country') || 'CN',

        // ✨ Fix: 补充必填字段
        firmwareVersion: get('FirmwareVersion', 'firmwareVersion') || '-',
        puuid: get('Puuid', 'puuid') || '-',
        isBound: get('BindStatus', 'bindStatus') === 1,

        gmtActive: fmtDate(get('ActiveTime', 'activeTime', 'BindTime', 'bindTime', 'CreateTime', 'createAt')),
        gmtLastOnline: fmtDate(get('LastOnlineTime', 'lastOnlineTime', 'UpdateTime', 'updateTime', 'lastSeen')),

        hasNewFirmware: false,

        // 保留原始数据 (Cast as any 以绕过 Device 类型检查)
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
    const payload = {
        pageIndex,
        pageSize,
        country: filters.dataCenter || 'CN',
        uuid: filters.keyword || undefined,
    }

    try {
        const res = await request.post<any>('/manager/api/Devices/GetDevices', payload)

        let rawList: RawDevice[] = []
        let total = 0

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

/**
 * 兼容性导出
 */
export const fetchDevices = fetchDeviceList;

/**
 * 获取设备统计数据
 */
export const fetchDeviceStats = async (country: string = 'CN'): Promise<DeviceRealStats> => {
    try {
        const [totalRes, onlineRes] = await Promise.all([
            request.post<any>('/manager/api/Devices/GetDevicesTotalCount', null, { params: { country } }),
            request.post<any>('/manager/api/Devices/GetDevices', {
                pageIndex: 1,
                pageSize: 1,
                country,
                onlineStatus: 1
            })
        ])

        // 解析 Total
        let total = 0
        if (typeof totalRes === 'number') total = totalRes
        else if (totalRes?.Data) total = Number(totalRes.Data)
        else if (totalRes?.data) total = Number(totalRes.data)

        // 解析 Online
        let online = 0
        const onlineData = onlineRes?.Data || onlineRes
        if (onlineData?.TotalCount) online = Number(onlineData.TotalCount)
        else if (Array.isArray(onlineData)) online = onlineData.length

        return {
            total: total || 0,
            online: online || 0,
            offline: Math.max(0, (total || 0) - (online || 0)),
            // ✨ Fix: 重命名为 activated 以匹配 DeviceSummary
            activated: total || 0
        }
    } catch (error) {
        console.warn('⚠️ Fetch Device Stats Failed, using defaults.', error)
        return { total: 0, online: 0, offline: 0, activated: 0 }
    }
}

/**
 * 获取设备详情
 */
export const fetchDeviceDetail = (id: string) => {
    return request.post<any>('/manager/api/Devices/GetDevices', {
        pageIndex: 1,
        pageSize: 1,
        uuid: id,
        country: 'CN'
    }).then(res => {
        const list = res.Data || []
        if (list.length > 0) return transformDevice(list[0])
        throw new Error('Device not found')
    })
}

/**
 * 删除设备 (RPC)
 */
export const deleteDevice = (id: string) => {
    // 假设后端删除接口，需根据实际情况调整 URL
    return request.post<void>('/manager/api/Devices/DeleteDevice', { uuid: id })
}

// ==========================================
// 🪵 日志 API (保留之前的修复版逻辑)
// ==========================================

const LOG_API = {
    GET_LIST: '/manager/api/DeviceLogs/GetDeviceLogs',
    GET_COUNT: '/manager/api/DeviceLogs/GetDeviceLogsTotalCount'
}

export const fetchDeviceLogs = async (params: DeviceLogQueryParams): Promise<PaginatedResponse<any>> => {
    const commonParams = {
        uuid: params.deviceId,
        dpid: params.eventId ? Number(params.eventId) : null,
        startTime: params.startTime,
        endTime: params.endTime
    }

    const listPayload = {
        ...commonParams,
        pageIndex: params.pageIndex || 1,
        pageSize: params.pageSize || 20
    }

    try {
        const [listRes, countRes] = await Promise.all([
            request.post<any>(LOG_API.GET_LIST, listPayload),
            request.post<any>(LOG_API.GET_COUNT, commonParams)
        ])

        // 解包列表
        const listBody = listRes.data || listRes || {};
        const rawList = Array.isArray(listBody)
            ? listBody
            : (Array.isArray(listBody.Data) ? listBody.Data : []);

        // 解包总数
        let total = 0;
        const countBody = countRes.data || countRes;
        if (typeof countBody === 'number') total = countBody;
        else if (countBody?.Data) total = Number(countBody.Data);
        else if (countBody?.total) total = Number(countBody.total);

        // 映射
        const items = rawList.map((log: any) => ({
            time: log.createdAt || log.CreateTime || new Date().toISOString(),
            event: log.dpid ? `DPID: ${log.dpid}` : (log.eventName || 'Report'),
            type: mapLogType(log.type || 'info'),
            details: typeof log.dpValue === 'object' ? JSON.stringify(log.dpValue) : String(log.dpValue || log.LogContent || ''),
            source: String(log.source || 'Device'),
            sourceDetail: log.remark || '-'
        }))

        return { items, total: total || 0 }
    } catch (error) {
        console.error('Fetch device logs failed:', error)
        return { items: [], total: 0 }
    }
}

function mapLogType(val: string): string {
    if (val === 'error') return 'danger';
    if (val === 'warn') return 'warning';
    return 'info';
}

// ==========================================
// 🆙 升级相关 API (透传)
// ==========================================

export const startDeviceUpgrade = (deviceId: string) => {
    return request.post<UpgradeTask>('/devices/upgrade', { deviceId })
}

export const getUpgradeTaskStatus = (taskId: string) => {
    return request.get<UpgradeTask>(`/upgrade-task/${taskId}`)
}