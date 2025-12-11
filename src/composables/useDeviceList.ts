import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchDevices as fetchDevicesApi } from '@/api/modules/device'
import { formatDate } from '@/utils/formatters'
import type { Device, DeviceListFilters, PaginationParams, DeviceQueryParams } from '@/types'

// 定义 Filters 的默认状态，方便重置
const DEFAULT_FILTERS: DeviceListFilters = {
    keyword: '',
    productId: '',
    isBound: '',
    dateRange: null, // 允许 null 以适配 Element Plus DatePicker
    dataCenter: ''
}

export const buildDeviceListParams = (
    filters: DeviceListFilters,
    pagination?: PaginationParams
): DeviceQueryParams => {
    const { isBound, productId, dateRange, keyword, dataCenter } = filters

    // 安全地处理日期
    const startDate = dateRange?.[0] ? formatDate(dateRange[0]) + ' 00:00:00' : undefined
    const endDate = dateRange?.[1] ? formatDate(dateRange[1]) + ' 23:59:59' : undefined

    // 组装参数，使用 undefined 代替 null/空串，某些 axios 配置会自动过滤 undefined key
    const rawParams: DeviceQueryParams = {
        isBound: isBound || undefined,
        productId: productId || undefined,
        q: keyword || undefined,
        gmtActive_gte: startDate,
        gmtActive_lte: endDate,
        dataCenter: dataCenter || undefined,
        _page: pagination?._page,
        _limit: pagination?._limit
    }

    return rawParams
}

export function useDeviceList() {
    const loading = ref(false)
    const deviceList = ref<Device[]>([])

    // 1. 状态管理内聚：filters 现在由 hook 内部管理
    const filters = reactive<DeviceListFilters>({ ...DEFAULT_FILTERS })

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