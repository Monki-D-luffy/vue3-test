// src/composables/useUpgradeCampaigns.ts
import { ref, reactive, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchCampaigns, deleteUpgradeCampaign } from '@/api'
import type { Product } from '@/types'

export function useUpgradeCampaigns(currentProduct: import('vue').Ref<Product | null>) {
    const loading = ref(false)
    const taskList = ref<any[]>([])

    // ✨ 新增：分页状态
    const pagination = reactive({
        currentPage: 1,
        pageSize: 10,
        total: 0
    })

    let pollingTimer: ReturnType<typeof setInterval> | null = null

    // 获取数据
    const fetchList = async (isBackground = false) => {
        if (!currentProduct.value?.id) return

        if (!isBackground) loading.value = true
        try {
            // ✨ 修改：传入分页参数
            const { items, total } = await fetchCampaigns({
                productId: currentProduct.value.id,
                _page: pagination.currentPage,
                _limit: pagination.pageSize,
                _sort: 'startedAt', // 保持按时间倒序
                _order: 'desc'
            })

            taskList.value = items
            pagination.total = total // ✨ 更新总数

            // 智能判断：如果有任务在运行，保持轮询；否则停止
            const hasActiveTask = taskList.value.some((task: any) =>
                ['running', 'pending'].includes(task.status)
            )

            if (hasActiveTask) {
                startPolling()
            } else {
                stopPolling()
            }
        } catch (error) {
            console.error(error)
            if (!isBackground) ElMessage.error('获取任务列表失败')
            stopPolling()
        } finally {
            loading.value = false
        }
    }

    // 轮询控制
    const startPolling = () => {
        if (pollingTimer) return
        pollingTimer = setInterval(() => {
            fetchList(true)
        }, 3000)
    }

    const stopPolling = () => {
        if (pollingTimer) {
            clearInterval(pollingTimer)
            pollingTimer = null
        }
    }

    // 删除任务
    const removeTask = async (taskId: string) => {
        try {
            await deleteUpgradeCampaign(taskId)
            ElMessage.success('任务已删除')
            // 删除后刷新，如果当前页只有一条数据且被删除，可能需要处理页码回退逻辑(此处简化直接刷新)
            fetchList()
        } catch (error) {
            console.error(error)
            ElMessage.error('删除失败')
        }
    }

    // ✨ 新增：分页变化处理
    const handlePaginationChange = () => {
        fetchList(false)
    }

    // 监听产品ID变化，重置分页并刷新
    watch(() => currentProduct.value?.id, (newId) => {
        stopPolling()
        taskList.value = []
        // 重置页码
        pagination.currentPage = 1
        pagination.total = 0

        if (newId) {
            fetchList()
        }
    }, { immediate: true })

    onUnmounted(() => {
        stopPolling()
    })

    return {
        loading,
        taskList,
        pagination, // 导出分页对象
        fetchList,
        removeTask,
        handlePaginationChange // 导出分页回调
    }
}