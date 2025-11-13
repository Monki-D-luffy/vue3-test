// 这个文件负责任务列表的获取、删除以及智能轮询。
import { ref, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchCampaigns, deleteUpgradeCampaign, createUpgradeCampaign } from '@/api'
import type { Product } from '@/types' // 假设你有 Campaign 相关的类型定义

export function useUpgradeCampaigns(currentProduct: import('vue').Ref<Product | null>) {
    const loading = ref(false)
    const taskList = ref<any[]>([])
    let pollingTimer: ReturnType<typeof setInterval> | null = null

    // 获取数据
    const fetchList = async (isBackground = false) => {
        if (!currentProduct.value?.id) return

        if (!isBackground) loading.value = true
        try {
            const res = await fetchCampaigns({ productId: currentProduct.value.id })
            taskList.value = Array.isArray(res) ? res : (res.items || [])

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
            stopPolling() // 出错防死循环
        } finally {
            loading.value = false
        }
    }

    // 轮询控制
    const startPolling = () => {
        if (pollingTimer) return
        // 3秒轮询一次
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
            // 删除后立即刷新一次
            fetchList()
        } catch (error) {
            console.error(error)
            ElMessage.error('删除失败')
        }
    }

    // 监听产品ID变化，自动切换数据
    watch(() => currentProduct.value?.id, (newId) => {
        stopPolling()
        taskList.value = []
        if (newId) {
            fetchList()
        }
    }, { immediate: true })

    // 组件销毁时自动停止，防止内存泄漏
    onUnmounted(() => {
        stopPolling()
    })

    return {
        loading,
        taskList,
        fetchList,
        removeTask,
        startPolling,
        stopPolling
    }
}