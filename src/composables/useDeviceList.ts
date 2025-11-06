// 处理复杂的列表和分页逻辑
import { ref, reactive } from 'vue'
import api from '@/api'
import { ElMessage } from 'element-plus'

// 定义过滤器的接口（可选，但推荐）
interface FetchParams {
    isBound?: string
    productId?: string
    dateRange?: any[]
    keyword?: string
    dataCenter?: string
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
    const fetchDevices = async (filters: FetchParams = {}) => {
        loading.value = true
        try {
            // 1. 解构参数
            const { isBound, productId, dateRange, keyword, dataCenter } = filters

            // 2. 准备原始参数
            const rawParams = {
                isBound,
                productId,
                q: keyword,
                gmtActive_gte: dateRange && dateRange[0] ? new Date(dateRange[0]).toISOString().split('T')[0] + ' 00:00:00' : null,
                gmtActive_lte: dateRange && dateRange[1] ? new Date(dateRange[1]).toISOString().split('T')[0] + ' 23:59:59' : null,
                dataCenter,
                _page: pagination.currentPage,
                _limit: pagination.pageSize
            }

            // 3. 清理无效参数
            const params: any = {}
            for (const key in rawParams) {
                // @ts-ignore
                if (rawParams[key] !== null && rawParams[key] !== undefined && rawParams[key] !== '') {
                    // @ts-ignore
                    params[key] = rawParams[key]
                }
            }

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
        // 注意：这里我们不直接调用 fetchDevices，而是让组件来决定何时重新获取，
        // 或者你可以选择在这里传入当前的 filters 重新获取。
        // 为了解耦，我们通常只更新状态，让外部的 watcher 或特定函数去触发重新请求。
        // 但在这个简单场景下，组件里监听 pagination变化 或者手动调用更可控。
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
        resetPagination
    }
}