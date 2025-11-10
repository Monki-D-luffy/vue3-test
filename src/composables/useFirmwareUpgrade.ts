// src/composables/useFirmwareUpgrade.ts
import { ref, onUnmounted } from 'vue'
import {
    startDeviceUpgrade,
    getUpgradeTaskStatus,
    type UpgradeTask,
    type UpgradeTaskStatus
} from '@/api/index' // 导入我们定义好的 API 函数和类型
import { ElMessage } from 'element-plus'

/**
 * 负责单个设备的固件升级流程，包含轮询和状态管理
 */
export function useFirmwareUpgrade() {
    // === 状态 (State) ===

    // 当前升级的任务ID
    const taskId = ref<string | null>(null)

    // 升级状态机，'idle' 表示初始/空闲状态
    // 允许前端临时状态 'starting'，因此把类型扩展为 UpgradeTaskStatus | 'starting'
    const upgradeStatus = ref<UpgradeTaskStatus | 'starting'>('idle')

    // 升级进度 (0-100)
    const progress = ref(0)

    // 错误信息
    const errorMessage = ref<string | null>(null)

    // 轮询定时器
    // 注意：在 TypeScript 中，setInterval 返回的类型是 number (Node.js) 或 any/number (Browser)
    // 我们使用 any 来保持兼容性
    const pollingTimer = ref<any>(null)

    // === 私有方法 (Private Methods) ===

    /**
     * 停止轮询
     */
    const stopPolling = () => {
        if (pollingTimer.value) {
            clearInterval(pollingTimer.value)
            pollingTimer.value = null
        }
    }

    /**
     * 轮询任务状态
     * 这是一个内部函数，由 startUpgrade 启动
     */
    const pollStatus = async () => {
        if (!taskId.value) {
            stopPolling()
            return
        }

        try {
            const task: UpgradeTask = await getUpgradeTaskStatus(taskId.value)

            // 更新状态
            upgradeStatus.value = task.status
            progress.value = task.progress
            errorMessage.value = task.errorMessage

            // 检查是否达到终态 (success 或 failed)
            if (task.status === 'success' || task.status === 'failed') {
                stopPolling() // 停止轮询
                if (task.status === 'success') {
                    ElMessage.success('设备升级成功')
                } else {
                    ElMessage.error(`升级失败: ${task.errorMessage || '未知错误'}`)
                }
            }
        } catch (error) {
            console.error('轮询升级状态失败:', error)
            errorMessage.value = '轮询状态失败'
            upgradeStatus.value = 'failed'
            stopPolling() // 发生网络错误时也停止轮询
        }
    }

    // === 公共方法 (Public Methods) ===

    /**
     * 重置所有状态到初始值
     * 会在弹窗关闭时调用
     */
    const resetState = () => {
        stopPolling() // 确保定时器被清除
        taskId.value = null
        upgradeStatus.value = 'idle'
        progress.value = 0
        errorMessage.value = null
    }

    /**
     * 开始升级流程
     * @param deviceId 要升级的设备ID
     */
    const startUpgrade = async (deviceId: string) => {
        // 1. 先重置状态，以防万一
        resetState()

        // 2. 设置起始状态
        upgradeStatus.value = 'starting' // 'starting' 是一个前端自定义状态，表示正在"请求开始"

        try {
            // 3. 调用 API，请求开始升级
            const initialTask: UpgradeTask = await startDeviceUpgrade(deviceId)

            // 4. API 返回成功，保存 taskId，更新状态为任务的初始状态
            taskId.value = initialTask.id
            upgradeStatus.value = initialTask.status
            progress.value = initialTask.progress

            // 5. 启动轮询器
            // 我们立即执行一次，然后设置定时器
            pollStatus() // 立即执行一次，获取 'downloading' 状态
            pollingTimer.value = setInterval(pollStatus, 3000) // 每 3 秒轮询一次

        } catch (error: any) {
            console.error('启动升级失败:', error)
            upgradeStatus.value = 'failed'
            // error.message 是拦截器中 ElMessage 弹出的内容
            errorMessage.value = error.message || '启动升级任务失败'
            stopPolling() // 启动失败，无需轮询
        }
    }

    // === 生命周期 (Lifecycle) ===

    /**
     * 当 Composable 所在的组件被卸载时，
     * 必须清除定时器，防止内存泄漏。
     */
    onUnmounted(() => {
        stopPolling()
    })

    // === 导出 ===
    return {
        upgradeStatus,
        progress,
        errorMessage,

        startUpgrade,
        resetState
    }
}