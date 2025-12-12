// src/composables/useDeviceList.ts
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchDevices as fetchDevicesApi } from '@/api/modules/device'
import { formatDate } from '@/utils/formatters'
import type { Device, DeviceListFilters, PaginationParams, DeviceQueryParams } from '@/types'

const DEFAULT_FILTERS: DeviceListFilters = {
    keyword: '',
    productId: '',
    isBound: '',
    dateRange: null,
    dataCenter: ''
}

export const buildDeviceListParams = (
    filters: DeviceListFilters,
    pagination?: PaginationParams
): DeviceQueryParams => {
    const { isBound, productId, dateRange, keyword, dataCenter } = filters
    const startDate = dateRange?.[0] ? formatDate(dateRange[0]) + ' 00:00:00' : undefined
    const endDate = dateRange?.[1] ? formatDate(dateRange[1]) + ' 23:59:59' : undefined

    return {
        isBound: isBound || undefined,
        productId: productId || undefined,
        q: keyword || undefined,
        gmtActive_gte: startDate,
        gmtActive_lte: endDate,
        dataCenter: dataCenter || undefined,
        _page: pagination?._page,
        _limit: pagination?._limit
    }
}

export function useDeviceList() {
    const loading = ref(false)
    // ✅ 修复点1: 确保初始化为空数组，永远不为 undefined
    const deviceList = ref<Device[]>([])

    const filters = reactive<DeviceListFilters>({ ...DEFAULT_FILTERS })
    const pagination = reactive({
        currentPage: 1,
        pageSize: 10,
        total: 0
    })

    const fetchDevices = async () => {
        loading.value = true
        try {
            const pageParams: PaginationParams = {
                _page: pagination.currentPage,
                _limit: pagination.pageSize
            }
            const params = buildDeviceListParams(filters, pageParams)

            // ✅ 修复点2: 移除直接解构，先获取原始响应 res
            const res: any = await fetchDevicesApi(params)

            // ✅ 修复点3: 兼容多种响应结构 (Array vs Object)
            if (Array.isArray(res)) {
                // 情况 A: 直接返回数组 (Mock Server 常见情况)
                deviceList.value = res
                // 如果没有 total，就用数组长度兜底
                pagination.total = res.length
            } else if (res && Array.isArray(res.items)) {
                // 情况 B: 标准分页结构 { items: [], total: 100 }
                deviceList.value = res.items
                pagination.total = Number(res.total) || 0
            } else {
                // 情况 C: 异常或空数据
                deviceList.value = []
                pagination.total = 0
            }

        } catch (error) {
            console.error('Failed to fetch devices:', error)
            deviceList.value = []
            pagination.total = 0
        } finally {
            loading.value = false
        }
    }

    const handleSearch = () => {
        pagination.currentPage = 1
        fetchDevices()
    }

    const handleReset = () => {
        Object.assign(filters, JSON.parse(JSON.stringify(DEFAULT_FILTERS)))
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
        pagination.currentPage = 1
        fetchDevices()
    }

    return {
        loading,
        deviceList,
        pagination,
        filters,
        fetchDevices,
        handleSearch,
        handleReset,
        handlePageChange,
        handleSizeChange
    }
}