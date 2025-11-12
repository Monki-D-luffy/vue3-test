// src/composables/useDeviceList.ts
import { ref, reactive } from 'vue'
import api from '@/api'
import { ElMessage } from 'element-plus'
import { formatDate } from '@/utils/formatters' // ✨ 导入新的日期格式化
import type { Device, DeviceListFilters } from '@/types' // ✨ 导入类型

interface PaginationParams {
    _page: number
    _limit: number
}

/**
 * 构建 /devices API 的查询参数
 */
export const buildDeviceListParams = (
    filters: DeviceListFilters = {},
    pagination?: PaginationParams
) => {
    const { isBound, productId, dateRange, keyword, dataCenter } = filters

    // ✨ [关键修复] 使用 formatDate 而不是 toISOString
    // 这样 "2025-01-01" 还是 "2025-01-01"，不会变成 "2024-12-31"
    const startDate = dateRange?.[0] ? formatDate(dateRange[0]) + ' 00:00:00' : null
    const endDate = dateRange?.[1] ? formatDate(dateRange[1]) + ' 23:59:59' : null

    const rawParams: any = {
        isBound,
        productId,
        q: keyword,
        gmtActive_gte: startDate,
        gmtActive_lte: endDate,
        dataCenter,
        ...pagination
    }

    // 清理无效参数
    const cleanedParams: any = {}
    for (const key in rawParams) {
        // 严格检查，保留 0 或 false，但排除 null/undefined/空字符串
        if (rawParams[key] !== null && rawParams[key] !== undefined && rawParams[key] !== '') {
            cleanedParams[key] = rawParams[key]
        }
    }

    return cleanedParams
}

export function useDeviceList() {
    const loading = ref(false)
    // ✨ 添加泛型，开发时会有智能提示
    const deviceList = ref<Device[]>([])
    const pagination = reactive({
        currentPage: 1,
        pageSize: 10,
        total: 0
    })

    const fetchDevices = async (filters: DeviceListFilters = {}) => {
        loading.value = true
        try {
            const params = buildDeviceListParams(filters, {
                _page: pagination.currentPage,
                _limit: pagination.pageSize
            })

            const response = await api.get(`/devices`, { params })

            // 假设后端遵循 x-total-count 标准
            pagination.total = Number(response.headers['x-total-count'] || 0)

            // 兼容 mock-server 可能返回的结构
            const data = response.data?.data || response.data || []
            deviceList.value = data

        } catch (error) {
            // 同样，拦截器可能已经报过错了，这里可以选择不报，或者报更具体的“列表加载失败”
            console.error(error)
            // 如果希望覆盖拦截器的通用报错，可以使用 ElMessage
        } finally {
            loading.value = false
        }
    }

    const handleSizeChange = (newSize: number) => {
        pagination.pageSize = newSize
        pagination.currentPage = 1
        // 注意：这里没有自动调用 fetchDevices，
        // 通常由组件监听 pagination 变化或手动调用
    }

    const handleCurrentChange = (newPage: number) => {
        pagination.currentPage = newPage
    }

    const resetPagination = () => {
        pagination.currentPage = 1
        pagination.pageSize = 10
    }

    return {
        loading,
        deviceList,
        pagination,
        fetchDevices,
        handleSizeChange,
        handleCurrentChange,
        resetPagination
    }
}