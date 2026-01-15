// src/api/business/device.ts
import { fetchDeviceList, fetchDeviceCount } from '@/api/services/deviceService'
import type { DeviceQueryParams } from '@/api/types/device'

// 定义给 Vue 组件用的返回结构
export interface DeviceTableResult {
    items: any[]; // 暂时用 any 或 DeviceModel，取决于你是否做前端字段映射
    total: number;
}

/**
 * [Smart API] 获取设备表格数据
 * 职责：
 * 1. 并在请求 List 和 Count
 * 2. 清洗空参数 (上位机 ViewModel 会把空搜索置为空字符串，这里保持一致)
 */
export const getDeviceTableData = async (
    page: number,
    pageSize: number,
    filters: Record<string, any>
): Promise<DeviceTableResult> => {

    // 1. 构造标准查询参数
    const queryPayload: DeviceQueryParams = {
        // ⚠️ 确认：上位机 ViewModel PageIndex 初始化为 1
        // 咱们前端 ElementUI 也是 1，所以这里直接透传，不需要 -1
        pageIndex: page,
        pageSize: pageSize,

        uuid: filters.keyword || '', // 搜索框对应 UUID
        country: filters.dataCenter || '',
        productId: filters.productId || '',

        // 时间范围处理
        startTime: filters.dateRange?.[0] ? new Date(filters.dateRange[0]).toISOString() : undefined,
        endTime: filters.dateRange?.[1] ? new Date(filters.dateRange[1]).toISOString() : undefined,
    }

    try {
        // 2. 并行请求 (正如上位机是分开获取的一样，我们用 Promise.all 模拟聚合)
        const [listData, totalCountResp] = await Promise.all([
            fetchDeviceList(queryPayload),
            // 总数接口只跟 Country 有关，跟搜索关键词无关 (根据 DevicesApiService.cs 逻辑)
            fetchDeviceCount(filters.dataCenter)
        ])

        // 3. 提取数据
        // 注意：fetchDeviceCount 返回的是 DeviceRegionCountDTO (含 TotalCount 字段) 还是直接 int?
        // 再次查阅文档 DevicesApiService.cs: GetDeviceRegionCountAsync 返回 DeviceRegionCountDTO
        // 所以这里要注意解包
        const total = (totalCountResp as any)?.totalCount || 0

        return {
            items: listData || [],
            total: total
        }
    } catch (error) {
        console.error('API Error:', error)
        // 可以在这里处理静默失败，或者抛出让 UI loading 停止
        throw error
    }
}