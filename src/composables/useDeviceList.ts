// src/composables/useDeviceList.ts
import { ref, reactive } from 'vue'
import api from '@/api'
import { ElMessage } from 'element-plus'

// 定义过滤器的接口
export interface DeviceListFilters {
    isBound?: string
    productId?: string
    dateRange?: any[]
    keyword?: string
    dataCenter?: string
}

// 定义分页接口
interface PaginationParams {
    _page: number
    _limit: number
}

// ✨ 1. (关键重构) 提取参数构建器
/**
 * 构建 /devices API 的查询参数
 * @param filters 视图层的原始筛选器
 * @param pagination (可选) 分页参数
 * @returns 清理过的、API 友好的参数对象
 */
export const buildDeviceListParams = (
    filters: DeviceListFilters = {},
    pagination?: PaginationParams
) => {
    // 1. 解构参数
    const { isBound, productId, dateRange, keyword, dataCenter } = filters

    // 2. 准备原始参数 (包含转换逻辑)
    const rawParams: any = {
        isBound,
        productId,
        q: keyword,
        gmtActive_gte: dateRange && dateRange[0] ? new Date(dateRange[0]).toISOString().split('T')[0] + ' 00:00:00' : null,
        gmtActive_lte: dateRange && dateRange[1] ? new Date(dateRange[1]).toISOString().split('T')[0] + ' 23:59:59' : null,
        dataCenter,
        ...pagination // 合并分页参数 (如果传入了)
    }

    // 3. 清理无效参数
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
    const deviceList = ref([])
    const pagination = reactive({
        currentPage: 1,
        pageSize: 10,
        total: 0
    })

    // 核心获取数据函数
    const fetchDevices = async (filters: DeviceListFilters = {}) => {
        loading.value = true
        try {
            // ✨ 2. (关键重构) 复用参数构建器
            const params = buildDeviceListParams(filters, {
                _page: pagination.currentPage,
                _limit: pagination.pageSize
            })

            // 4. 发送请求
            const response = await api.get(`/devices`, { params })

            // 5. 更新状态
            pagination.total = Number(response.headers['x-total-count'] || 0)
            deviceList.value = response.data.data

        } catch (error) {
            ElMessage.error('获取设备列表失败')
            console.error(error)
        } finally {
            loading.value = false
        }
    }

    // 分页事件处理
    const handleSizeChange = (newSize: number) => {
        pagination.pageSize = newSize
        pagination.currentPage = 1 // 重置到第一页
    }

    const handleCurrentChange = (newPage: number) => {
        pagination.currentPage = newPage
    }

    // 重置分页
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
        resetPagination,
        // ✨ 3. (关键重构) 导出构建器
        buildDeviceListParams
    }
}