// src/composables/useDeviceList.ts
import { ref, reactive } from 'vue'
import api from '@/api'
// import { ElMessage } from 'element-plus' // 如果没用到可以暂时注释掉，保持整洁
import { formatDate } from '@/utils/formatters'
// ✅ 引入 PaginationParams
import type { Device, DeviceListFilters, PaginationParams } from '@/types'

/**
 * 构建 /devices API 的查询参数
 */
export const buildDeviceListParams = (
    filters: DeviceListFilters = {},
    pagination?: PaginationParams
) => {
    const { isBound, productId, dateRange, keyword, dataCenter } = filters

    const startDate = dateRange?.[0] ? formatDate(dateRange[0]) + ' 00:00:00' : null
    const endDate = dateRange?.[1] ? formatDate(dateRange[1]) + ' 23:59:59' : null

    const rawParams: any = {
        isBound,
        productId,
        q: keyword,
        gmtActive_gte: startDate,
        gmtActive_lte: endDate,
        dataCenter,
        // 展开分页参数
        ...pagination
    }

    // 清理无效参数
    const cleanedParams: any = {}
    for (const key in rawParams) {
        if (rawParams[key] !== null && rawParams[key] !== undefined && rawParams[key] !== '') {
            cleanedParams[key] = rawParams[key]
        }
    }

    return cleanedParams
}

export function useDeviceList() {
    const loading = ref(false)
    const deviceList = ref<Device[]>([])
    const pagination = reactive({
        currentPage: 1,
        pageSize: 10,
        total: 0
    })

    const fetchDevices = async (filters: DeviceListFilters = {}) => {
        loading.value = true
        try {
            // ✅ 类型安全：这里的对象符合 PaginationParams 接口
            const pageParams: PaginationParams = {
                _page: pagination.currentPage,
                _limit: pagination.pageSize
            }

            const params = buildDeviceListParams(filters, pageParams)

            const response = await api.get(`/devices`, { params })

            pagination.total = Number(response.headers['x-total-count'] || 0)
            const data = response.data?.data || response.data || []
            deviceList.value = data

        } catch (error) {
            console.error(error)
        } finally {
            loading.value = false
        }
    }

    const handleSizeChange = (newSize: number) => {
        pagination.pageSize = newSize
        pagination.currentPage = 1
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