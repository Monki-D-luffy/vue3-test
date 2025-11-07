// src/composables/useDeviceLogs.ts
import { ref, reactive } from 'vue'
import api from '@/api'
import { ElMessage } from 'element-plus'

// 定义过滤器类型
interface LogFilters {
    taskId: string
    eventId: string
    type: string
    dateRange: [Date, Date] | null
}

export function useDeviceLogs() {
    const loading = ref(false)
    const logData = ref([])
    const pagination = reactive({
        currentPage: 1,
        pageSize: 10,
        total: 0
    })

    // 格式化日期以匹配 mock server (YYYY-MM-DDTHH:mm:ss.sssZ)
    const formatISODate = (date: Date | null | undefined) => {
        return date ? date.toISOString() : null
    }

    const fetchLogs = async (deviceId: string, filters: LogFilters) => {
        loading.value = true
        try {
            // 1. 准备搜索参数
            // json-server 支持 'q' 进行全文搜索
            // 我们将任务ID和事件ID都用 'q' 来模糊搜索
            const searchQuery = [filters.taskId, filters.eventId].filter(Boolean).join(' ')

            const rawParams = {
                deviceId: deviceId,
                type: filters.type === 'all' ? null : filters.type,
                q: searchQuery || null,
                time_gte: filters.dateRange ? formatISODate(filters.dateRange[0]) : null,
                time_lte: filters.dateRange ? formatISODate(filters.dateRange[1]) : null,
                _page: pagination.currentPage,
                _limit: pagination.pageSize,
                _sort: 'time', // 按时间排序
                _order: 'desc' // 默认倒序
            }

            // 2. 清理无效参数
            const params: any = {}
            for (const key in rawParams) {
                // @ts-ignore
                if (rawParams[key] !== null && rawParams[key] !== undefined && rawParams[key] !== '') {
                    // @ts-ignore
                    params[key] = rawParams[key]
                }
            }

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
        resetPagination
    }
}