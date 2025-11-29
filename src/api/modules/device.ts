// src/api/modules/device.ts
import request from '@/utils/request'
import type { Device, PaginationParams, ApiResponse, PaginatedResponse, UpgradeTask } from '@/types'

// ... (fetchDevices, deleteDevice 等保持不变)

export const fetchDevices = async (params: any): Promise<PaginatedResponse<Device>> => {
    const res: any = await request.get('/devices', { params })
    const items = res.data || res || [] // 兼容处理
    const total = res.total || (res.header && res.header['x-total-count']) || items.length
    return { items, total: Number(total) }
}

export const deleteDevice = (id: string) => {
    return request.delete(`/devices/${id}`)
}

// ✅ 修复 1: 修正统计接口路径
// Mock Server 的 dashboard.js 定义了 /stats，并且 server.js 挂载在 /api/dashboard
export const fetchDeviceSummary = async (dataCenter?: string) => {
    const params = dataCenter ? { dataCenter } : {}
    // 注意：路径是 /dashboard/stats，不是 /device-summary
    const res: any = await request.get('/dashboard/stats', { params })
    return res.data || res // 兼容返回结构
}

// ✅ 修复 2: 新增日志获取接口
export const fetchDeviceLogs = async (params: any) => {
    // 假设 json-server 中有一个 logs 或 deviceLogs 资源
    // request.ts 拦截器默认返回 response.data
    const res: any = await request.get('/deviceLogs', { params })

    // 组装分页数据
    const items = res.data || res || []
    // 尝试获取 total，如果 request 拦截器没有处理 header，这里可能拿不到 total
    // 建议按照之前 request.ts 的修改建议，让拦截器把 headers 挂载到返回对象上
    const total = res.total || items.length

    return { items, total }
}

// ... (startDeviceUpgrade, getUpgradeTaskStatus 保持不变)
export const startDeviceUpgrade = async (deviceId: string): Promise<UpgradeTask> => {
    const res: any = await request.post('/devices/upgrade', { deviceId })
    return res.data || res
}

export const getUpgradeTaskStatus = async (taskId: string): Promise<UpgradeTask> => {
    const res: any = await request.get(`/upgrade-task/${taskId}`)
    return res.data || res
}

// ✅ [新增] 获取单个设备详情
export const fetchDeviceDetail = async (id: string): Promise<Device> => {
    const res: any = await request.get(`/devices/${id}`)
    // 兼容 mock server 的 { code: 200, data: {...} } 结构
    return res.data || res
}

// ✅ [新增] 获取仪表盘聚合数据 (供 useDashboard 使用)
export const fetchDashboardData = async () => {
    const res: any = await request.get('/dashboard/stats')
    return res.data || res
}