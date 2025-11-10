// src/composables/useDeviceLogs.ts
import { ref, reactive } from 'vue'
import api from '@/api'
import { ElMessage } from 'element-plus'
// 移除了 'Device' 类型的导入，因为它不再需要

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

// ✨ 1. (关键重构) 提取参数构建器
/**
 * 构建 /deviceLogs API 的查询参数
 * @param deviceId 设备ID
 * @param filters 视图层的原始筛选器
 * @param pagination (可选) 分页参数
 * @returns 清理过的、API 友好的参数对象
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
        ...pagination // 合并分页参数 (如果传入了)
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
    const logData = ref([])
    const pagination = reactive({
        currentPage: 1,
        pageSize: 10,
        total: 0
    })

    // --- 新增状态: 仅需控制弹窗可见性 ---
    const isUpgradeModalVisible = ref(false)
    // --- (移除了 device 状态) ---

    const fetchLogs = async (deviceId: string, filters: LogFilters) => {
        loading.value = true
        try {
            // ✨ 2. (关键重构) 复用参数构建器
            const params = buildDeviceLogParams(deviceId, filters, {
                _page: pagination.currentPage,
                _limit: pagination.pageSize
            })

            // 3. 发送API请求
            const response = await api.get(`/deviceLogs`, { params })

            // 4. 更新状态
            logData.value = response.data.data
            pagination.total = Number(response.headers['x-total-count'] || 0)

        } catch (error) {
            ElMessage.error('获取设备日志失败')
            console.error(error)
        } finally {
            loading.value = false
        }
    }

    // --- 新增方法: 用于固件升级 ---

    // --- (移除了 fetchDeviceDetails) ---

    /**
     * 打开升级模态框
     */
    const openUpgradeModal = () => {
        isUpgradeModalVisible.value = true;
    }

    /**
     * 升级完成后的回调
     */
    const handleUpgradeDone = () => {
        // 升级完成，目前日志页无需特殊操作
        // 未来如果需要，可在此处添加逻辑
        console.log('Upgrade done event received in composable.')
    }
    // ---------------------------------


    // 分页事件处理
    const handleSizeChange = (newSize: number) => {
        pagination.pageSize = newSize
        pagination.currentPage = 1 // 切换size时重置到第一页
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
        logData,
        pagination,
        fetchLogs,
        handleSizeChange,
        handleCurrentChange,
        resetPagination,
        // ✨ 3. (关键重构) 导出构建器
        buildDeviceLogParams,

        // --- 导出更新后的状态和方法 ---
        isUpgradeModalVisible,
        openUpgradeModal,
        handleUpgradeDone
        // --- (移除了 device 和 fetchDeviceDetails) ---
    }
}