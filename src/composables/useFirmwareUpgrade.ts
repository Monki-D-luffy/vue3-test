import { ref, onUnmounted } from 'vue'
// ✅ 1. 从 api 导入功能函数
import {
    startDeviceUpgrade,
    getUpgradeTaskStatus
} from '@/api/index'
// ✅ 2. 从 types 导入类型
import type {
    UpgradeTask,
    UpgradeTaskStatus
} from '@/types'

import { ElMessage } from 'element-plus'

/**
 * 负责单个设备的固件升级流程，包含轮询和状态管理
 */
export function useFirmwareUpgrade() {
    // === 状态 (State) ===
    const taskId = ref<string | null>(null)
    // 给 status 一个明确的初始类型提示
    const upgradeStatus = ref<UpgradeTaskStatus | 'starting' | 'idle'>('idle')
    const progress = ref(0)
    const errorMessage = ref<string | null>(null)
    // 加载锁，防止重复提交
    const isUpgrading = ref(false)

    let pollingTimer: ReturnType<typeof setInterval> | null = null

    // === 私有方法 (Private Methods) ===

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
            const task = await getUpgradeTaskStatus(taskId.value)

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
            errorMessage.value = '获取任务状态失败，请手动刷新'
            cleanup()
        }
    }

    // === 公共方法 (Public Methods) ===

    const resetState = () => {
        cleanup()
        taskId.value = null
        upgradeStatus.value = 'idle'
        progress.value = 0
        errorMessage.value = null
    }

    const startUpgrade = async (deviceId: string) => {
        if (isUpgrading.value) return

        resetState()
        isUpgrading.value = true
        upgradeStatus.value = 'starting'

        try {
            const task = await startDeviceUpgrade(deviceId)

            taskId.value = task.id
            upgradeStatus.value = task.status
            progress.value = task.progress || 0

            await pollStatus()
            pollingTimer = setInterval(pollStatus, 2000)

        } catch (error: any) {
            console.error('启动升级失败:', error)
            upgradeStatus.value = 'failed'
            errorMessage.value = error.message || '无法启动升级任务'
            cleanup()
        }
    }

    // === 生命周期 ===
    onUnmounted(() => {
        cleanup()
    })

    return {
        upgradeStatus,
        progress,
        errorMessage,
        isUpgrading,
        startUpgrade,
        resetState
    }
}