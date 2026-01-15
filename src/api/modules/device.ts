// src/api/modules/device.ts
import request from '@/api/core/request'
import type {
    DeviceLogsQueryRequest,
    DeviceLogsCountRequest
} from '@/api/generated/business'
import type {
    Device,
    DeviceQueryParams,
    PaginatedResponse,
    DeviceSummary,
    UpgradeTask,
    DeviceLogQueryParams
} from '@/types'

/**
 * 获取设备列表
 * 拦截器已自动处理 x-total-count 并转换为 PaginatedResponse 结构
 */
export const fetchDevices = (params: DeviceQueryParams) => {
    return request.get<PaginatedResponse<Device>>('/devices', { params })
}

/**
 * 获取设备详情
 */
export const fetchDeviceDetail = (id: string) => {
    return request.get<Device>(`/devices/${id}`)
}

/**
 * 删除设备
 */
export const deleteDevice = (id: string) => {
    return request.delete<void>(`/devices/${id}`)
}

/**
 * 获取设备统计概览
 */
export const fetchDeviceSummary = (dataCenter?: string) => {
    const params = dataCenter ? { dataCenter } : {}
    return request.get<DeviceSummary>('/dashboard/stats', { params })
}

// ==========================================
// ✨ 修复后的真实设备日志 API
// ==========================================

const LOG_API = {
    GET_LIST: '/manager/api/DeviceLogs/GetDeviceLogs',
    GET_COUNT: '/manager/api/DeviceLogs/GetDeviceLogsTotalCount'
}

/**
 * 获取设备日志 (真实后端对接 - 修复版)
 * 解决 total 解析失败导致分页消失的问题
 */
export const fetchDeviceLogs = async (params: DeviceLogQueryParams): Promise<PaginatedResponse<any>> => {
    const commonParams = {
        uuid: params.deviceId,
        // ✨ Fix: 修复之前的拼写检查可能导致的误会，确保使用正确的 eventId
        dpid: params.eventId ? Number(params.eventId) : null,
        startTime: params.startTime,
        endTime: params.endTime
    }

    // ✨ Fix: 使用 pageIndex 和 pageSize (interface 已在 types/index.ts 更新)
    const listPayload: DeviceLogsQueryRequest = {
        ...commonParams,
        pageIndex: params.pageIndex || 1,
        pageSize: params.pageSize || 20
    }

    const countPayload: DeviceLogsCountRequest = {
        ...commonParams
    }

    try {
        const [listRes, countRes] = await Promise.all([
            request.post<any>(LOG_API.GET_LIST, listPayload),
            request.post<any>(LOG_API.GET_COUNT, countPayload)
        ])

        // 1. 数据解包
        const listBody = listRes.data || {};
        const rawList = Array.isArray(listBody)
            ? listBody
            : (Array.isArray(listBody.Data) ? listBody.Data : []);

        const countBody = countRes.data;
        let total = 0;
        if (typeof countBody === 'number') {
            total = countBody;
        } else if (countBody && typeof countBody.Data === 'number') {
            total = countBody.Data;
        } else if (countBody && typeof countBody.total === 'number') {
            total = countBody.total;
        }

        // 2. ✨ 精确映射 (基于您提供的 Console Log)
        // Raw: { dpid: 22, dpValue: "00.00.13", createdAt: "...", remark: "", source: "1" }
        const items = rawList.map((log: any) => ({
            // 时间: createdAt
            time: log.createdAt || log.CreateTime || new Date().toISOString(),

            // 事件: dpid (如 "DPID: 22")
            event: log.dpid ? `DPID: ${log.dpid}` : (log.eventName || '系统上报'),

            // 级别: 后端无此字段，根据 dpid 或默认给 info
            type: 'info',

            // 详情: dpValue
            details: formatDetails(log.dpValue || log.LogContent),

            // 来源: source
            source: mapSource(log.source),

            // 来源详情: remark
            sourceDetail: log.remark || '-'
        }))

        return {
            items,
            total: total || 0
        }
    } catch (error) {
        console.error('Fetch device logs failed:', error)
        return { items: [], total: 0 }
    }
}
/**
 * 辅助：日志类型映射
 * 解决乱码或数字显示问题
 */
function mapLogType(val: any): string {
    // 强制转字符串比较
    const s = String(val).toLowerCase();

    // 数字映射
    if (s === '1' || s === 'info') return 'info';
    if (s === '2' || s === 'warn' || s === 'warning') return 'warning';
    if (s === '3' || s === 'error' || s === 'fatal') return 'danger';

    // 中文模糊匹配
    if (s.includes('错误') || s.includes('异常')) return 'danger';
    if (s.includes('警告')) return 'warning';

    return 'info'; // 默认
}

function formatDetails(val: any): string {
    if (!val) return '{}';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
}
/**
 * 辅助：来源映射
 */
function mapSource(val: any): string {
    const s = String(val);
    if (s === '1') return '设备上报';
    if (s === '2') return '云端下发';
    if (s === '3') return 'App操作';
    return s || 'Device';
}
// ==========================================
// 升级相关 API
// ==========================================

export const startDeviceUpgrade = (deviceId: string) => {
    return request.post<UpgradeTask>('/devices/upgrade', { deviceId })
}

export const getUpgradeTaskStatus = (taskId: string) => {
    return request.get<UpgradeTask>(`/upgrade-task/${taskId}`)
}

// ==========================================
// 真实 API
// ==========================================

/**
 * ✨ [New] 真实后端设备查询接口 (RPC 风格)
 * 对应后端: POST /api/Devices/GetDevices
 * * @param data.pageIndex 页码 (1-based)
 * @param data.pageSize 页大小
 * @param data.country 区域代码 (必填, 如 "CN")
 * @param data.uuid (可选) 设备 UUID 用于精确查询
 */
export const fetchRealDeviceList = (data: {
    pageIndex: number;
    pageSize: number;
    country?: string;
    uuid?: string;
}) => {
    // 注意：前缀 manager 会被 vite.config.ts 代理转发到真实服务器
    return request.post('manager/api/Devices/GetDevices', data)
}