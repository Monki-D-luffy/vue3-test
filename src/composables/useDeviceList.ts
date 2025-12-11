import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchDevices as fetchDevicesApi } from '@/api/modules/device'
import { formatDate } from '@/utils/formatters'
import type { Device, DeviceListFilters, PaginationParams } from '@/types'

// 定义 Filters 的默认状态，方便重置
const DEFAULT_FILTERS = {
    keyword: '',
    productId: '',
    isBound: '',
    dateRange: null, // 允许 null 以适配 Element Plus DatePicker
    dataCenter: ''
}

export const buildDeviceListParams = (
    filters: any,
    pagination?: PaginationParams
) => {
    // 解构并处理日期
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
        ...pagination
    }

    // 清理无效参数 (undefined, null, 空字符串)
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

    // 1. 状态管理内聚：filters 现在由 hook 内部管理
    const filters = reactive({ ...DEFAULT_FILTERS })

    const pagination = reactive({
        currentPage: 1,
        pageSize: 10,
        total: 0
    })

    // 核心获取数据逻辑
    const fetchDevices = async () => {
        loading.value = true
        try {
            const pageParams: PaginationParams = {
                _page: pagination.currentPage,
                _limit: pagination.pageSize
            }
            // 直接使用内部管理的 filters
            const params = buildDeviceListParams(filters, pageParams)
            const { items, total } = await fetchDevicesApi(params)

            deviceList.value = items
            pagination.total = total
        } catch (error) {
            console.error(error)
            deviceList.value = []
        } finally {
            loading.value = false
        }
    }

    // 2. 暴露标准操作方法
    const handleSearch = () => {
        pagination.currentPage = 1
        fetchDevices()
    }

    const handleReset = () => {
        // 恢复默认 filters
        Object.assign(filters, DEFAULT_FILTERS)
        pagination.currentPage = 1
        fetchDevices()
        ElMessage.success('筛选条件已重置')
    }

    const handlePageChange = (val: number) => {
        pagination.currentPage = val
        fetchDevices()
    }

    const handleSizeChange = (val: number) => {
        pagination.pageSize = val
        pagination.currentPage = 1 // 改变页码大小时通常重置回第一页
        fetchDevices()
    }

    return {
        // State
        loading,
        deviceList,
        pagination,
        filters, // 👈 暴露出去给 UI 绑定 v-model

        // Actions
        fetchDevices,
        handleSearch,
        handleReset,
        handlePageChange,
        handleSizeChange
    }
}