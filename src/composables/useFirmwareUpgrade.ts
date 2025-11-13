import { ref, onUnmounted } from 'vue'
import {
    startDeviceUpgrade,
    getUpgradeTaskStatus,
    type UpgradeTask,
    type UpgradeTaskStatus
} from '@/api/index'
import { ElMessage } from 'element-plus'

/**
 * 负责单个设备的固件升级流程，包含轮询和状态管理
 */
export function useFirmwareUpgrade() {
    // === 状态 (State) ===
    const taskId = ref<string | null>(null)
    const upgradeStatus = ref<UpgradeTaskStatus | 'starting'>('idle')
    const progress = ref(0)
    const errorMessage = ref<string | null>(null)
    // ✨ 新增：加载锁，防止重复提交
    const isUpgrading = ref(false)

    let pollingTimer: any = null

    // === 私有方法 (Private Methods) ===

    /**
     * 清理资源（定时器、状态锁）
     */
    const cleanup = () => {
        if (pollingTimer) {
            clearInterval(pollingTimer)
            pollingTimer = null
        }
        isUpgrading.value = false
    }

    /**
     * 轮询任务状态
     */
    const pollStatus = async () => {
        if (!taskId.value) {
            cleanup()
            return
        }

        try {
            const task: UpgradeTask = await getUpgradeTaskStatus(taskId.value)

            // 更新 UI 状态
            upgradeStatus.value = task.status
            progress.value = task.progress
            errorMessage.value = task.errorMessage

            // 检查终态
            if (task.status === 'success') {
                cleanup()
                ElMessage.success('设备升级成功！')
            } else if (task.status === 'failed') {
                cleanup()
                ElMessage.error(`升级失败: ${task.errorMessage || '未知原因'}`)
            }
            // 如果是 pending/downloading/installing，继续轮询
        } catch (error) {
            console.error('轮询状态出错:', error)
            // 遇到网络波动不立即报错停止，可以选择容错几次（此处简化为直接停止）
            errorMessage.value = '获取任务状态失败，请手动刷新'
            cleanup() // 停止轮询，避免无限报错
        }
    }

    // === 公共方法 (Public Methods) ===

    /**
     * 重置 UI 状态（通常在关闭弹窗时调用）
     */
    const resetState = () => {
        cleanup()
        taskId.value = null
        upgradeStatus.value = 'idle'
        progress.value = 0
        errorMessage.value = null
    }

    /**
     * 启动升级
     * @param deviceId 设备ID
     */
    const startUpgrade = async (deviceId: string) => {
        // 1. 防抖/锁检查
        if (isUpgrading.value) return

        // 2. 初始化
        resetState()
        isUpgrading.value = true
        upgradeStatus.value = 'starting'

        try {
            // 3. 发起请求
            const task = await startDeviceUpgrade(deviceId)

            // 4. 记录任务ID并开始轮询
            taskId.value = task.id
            upgradeStatus.value = task.status
            progress.value = task.progress || 0

            // 立即查询一次，然后间隔轮询
            await pollStatus()
            pollingTimer = setInterval(pollStatus, 2000) // 2秒轮询一次

        } catch (error: any) {
            console.error('启动升级失败:', error)
            upgradeStatus.value = 'failed'
            errorMessage.value = error.message || '无法启动升级任务'
            cleanup() // 释放锁
        }
    }

    // === 生命周期 ===
    onUnmounted(() => {
        cleanup()
    })

    return {
        // State
        upgradeStatus,
        progress,
        errorMessage,
        isUpgrading, // 暴露出去，供 UI 显示 loading 状态

        // Actions
        startUpgrade,
        resetState
    }
}