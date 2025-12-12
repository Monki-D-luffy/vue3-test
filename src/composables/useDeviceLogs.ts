// src/composables/useDeviceLogs.ts
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchDeviceLogs as fetchLogsApi } from '@/api/modules/device'

// 定义过滤器类型
export interface LogFilters {
    taskId: string
    eventId: string
    type: string
    dateRange: [Date, Date] | null
}

// 定义分页接口
interface PaginationParams {
    _page: number
    _limit: number
}

// 格式化日期以匹配 mock server (YYYY-MM-DDTHH:mm:ss.sssZ)
const formatISODate = (date: Date | null | undefined) => {
    return date ? date.toISOString() : null
}

/**
 * 参数构建器：提取出来供导出功能复用
 */
export const buildDeviceLogParams = (
    deviceId: string,
    filters: LogFilters,
    pagination?: PaginationParams
) => {
    // 1. 准备搜索参数
    const searchQuery = [filters.taskId, filters.eventId].filter(Boolean).join(' ')

    const rawParams: any = {
        deviceId: deviceId,
        type: filters.type === 'all' ? null : filters.type,
        q: searchQuery || null,
        time_gte: filters.dateRange ? formatISODate(filters.dateRange[0]) : null,
        time_lte: filters.dateRange ? formatISODate(filters.dateRange[1]) : null,
        _sort: 'time', // 按时间排序
        _order: 'desc', // 默认倒序
        ...pagination // 合并分页参数
    }

    // 2. 清理无效参数
    const cleanedParams: any = {}
    for (const key in rawParams) {
        if (rawParams[key] !== null && rawParams[key] !== undefined && rawParams[key] !== '') {
            cleanedParams[key] = rawParams[key]
        }
    }

    return cleanedParams
}

export function useDeviceLogs() {
    const loading = ref(false)
    // ✅ 修复1: 初始化为空数组，防止 undefined 报错
    const logData = ref<any[]>([])

    // ✅ 修复2: 状态内聚，由 Composable 管理
    const filters = reactive<LogFilters>({
        taskId: '',
        eventId: '',
        type: 'all',
        dateRange: null
    })

    const pagination = reactive({
        currentPage: 1,
        pageSize: 10,
        total: 0
    })

    const isUpgradeModalVisible = ref(false)

    // 获取日志主逻辑
    const fetchLogs = async (deviceId: string) => {
        if (!deviceId || deviceId === 'N/A') return

        loading.value = true
        try {
            const params = buildDeviceLogParams(deviceId, filters, {
                _page: pagination.currentPage,
                _limit: pagination.pageSize
            })

            // 获取原始响应
            const res: any = await fetchLogsApi(params)

            // ✅ 修复3: 数据适配器 (Data Adapter)
            // 自动兼容 "纯数组" 和 "标准分页对象" 两种格式
            if (Array.isArray(res)) {
                logData.value = res
                pagination.total = res.length
            } else if (res && Array.isArray(res.items)) {
                logData.value = res.items
                pagination.total = Number(res.total || 0)
            } else {
                logData.value = []
                pagination.total = 0
            }

        } catch (error) {
            ElMessage.error('获取设备日志失败')
            console.error(error)
            logData.value = [] // 出错兜底
        } finally {
            loading.value = false
        }
    }

    // --- 辅助方法 ---
    const openUpgradeModal = () => {
        isUpgradeModalVisible.value = true;
    }

    const handleUpgradeDone = () => {
        console.log('Upgrade done event received.')
    }

    const handleSizeChange = (newSize: number, deviceId: string) => {
        pagination.pageSize = newSize
        pagination.currentPage = 1
        fetchLogs(deviceId)
    }

    const handleCurrentChange = (newPage: number, deviceId: string) => {
        pagination.currentPage = newPage
        fetchLogs(deviceId)
    }

    const resetPagination = () => {
        pagination.currentPage = 1
    }

    return {
        // State
        loading,
        logData,
        pagination,
        filters, // 导出 filters 供视图绑定
        isUpgradeModalVisible,

        // Actions
        fetchLogs,
        handleSizeChange,
        handleCurrentChange,
        resetPagination,
        openUpgradeModal,
        handleUpgradeDone,
        buildDeviceLogParams
    }
}