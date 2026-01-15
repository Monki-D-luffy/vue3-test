// src/api/modules/device.ts
import request from '@/api/core/request'
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

/**
 * 获取设备日志
 * 假设后端对 /deviceLogs 返回 { items: [], total: N } 或 数组+Header
 */
export const fetchDeviceLogs = (params: DeviceLogQueryParams) => {
    return request.get<PaginatedResponse<any>>('/deviceLogs', { params })
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