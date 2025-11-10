<template>
    <el-dialog v-model="visible" :title="title" width="500px" :before-close="handleClose" :close-on-click-modal="false"
        :close-on-press-escape="false">
        <div class="upgrade-modal-content">
            <el-steps :active="activeStep" finish-status="success" simple>
                <el-step title="开始升级" />
                <el-step title="下载固件" />
                <el-step title="安装中" />
                <el-step title="完成" />
            </el-steps>

            <div class="progress-section">
                <el-progress :percentage="progress" :status="progressStatus" :stroke-width="12" striped striped-flow />
                <p class="status-text">{{ statusText }}</p>
            </div>

            <el-alert v-if="errorMessage" :title="errorMessage" type="error" show-icon :closable="false" />
        </div>

        <template #footer>
            <span class="dialog-footer">
                <el-button @click="handleClose" :disabled="isUpgrading">
                    {{ isUpgrading ? '正在升级...' : '关闭' }}
                </el-button>
            </span>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, type PropType } from 'vue'
import {
    ElDialog,
    ElSteps,
    ElStep,
    ElProgress,
    ElAlert,
    ElButton,
    ElMessageBox
} from 'element-plus'
import { useFirmwareUpgrade } from '@/composables/useFirmwareUpgrade'
import type { UpgradeTaskStatus } from '@/api/index'
// 我们需要 Device 类型来定义 prop
import type { Device } from '@/composables/useDeviceList'

// === Props & Emits ===

const props = defineProps({
    // v-model (控制显示/隐藏)
    modelValue: {
        type: Boolean,
        default: false
    },
    // 需要升级的设备对象
    device: {
        type: Object as PropType<Device | null>,
        default: null
    }
})

const emit = defineEmits([
    'update:modelValue', // v-model
    'upgrade-done' // 升级完成后通知父组件
])

// === 核心逻辑: 消费 Composable ===

const {
    upgradeStatus,
    progress,
    errorMessage,
    startUpgrade,
    resetState
} = useFirmwareUpgrade()

// === v-model & 弹窗控制 ===

const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
})

// === 状态机 UI 映射 ===

const title = computed(() => {
    if (!props.device) return '固件升级'
    return `正在为 [${props.device.name}] 升级`
})

// 计算当前激活的步骤
const activeStep = computed(() => {
    switch (upgradeStatus.value) {
        case 'idle':
        case 'starting':
            return 0
        case 'downloading':
            return 1
        case 'installing':
            return 2
        case 'success':
        case 'failed':
            return 4 // 完成所有步骤
        default:
            return 0
    }
})

// 计算进度条的状态 (用于显示 成功/失败 图标)
const progressStatus = computed(() => {
    if (upgradeStatus.value === 'failed') return 'exception'
    if (upgradeStatus.value === 'success') return 'success'
    return '' // 默认
})

// 计算状态文本
const statusText = computed(() => {
    switch (upgradeStatus.value) {
        case 'idle':
            return '等待开始...'
        case 'starting':
            return '正在启动升级任务...'
        case 'downloading':
            return `正在下载固件... (${progress.value}%)`
        case 'installing':
            return `正在安装固件... (${progress.value}%)`
        case 'success':
            return '升级成功！'
        case 'failed':
            return '升级失败'
        default:
            return '未知状态'
    }
})

// 计算是否正在升级中 (用于禁用关闭按钮)
const isUpgrading = computed(() => {
    return ['starting', 'downloading', 'installing'].includes(upgradeStatus.value)
})

// === 逻辑执行 (Watchers) ===

// 1. 监听弹窗打开，触发升级
watch(
    () => props.modelValue,
    (newVal) => {
        if (newVal && props.device) {
            // 弹窗被打开，且 device 存在
            startUpgrade(props.device.id)
        } else if (!newVal) {
            // 弹窗被关闭
            resetState() // 清理定时器和状态
        }
    }
)

// 2. 监听升级是否达到终态
watch(upgradeStatus, (newStatus) => {
    if (newStatus === 'success' || newStatus === 'failed') {
        // 通知父组件（DeviceDashboard）刷新列表
        emit('upgrade-done')
    }
})

// === 事件处理 ===

const handleClose = () => {
    if (isUpgrading.value) {
        ElMessageBox.confirm(
            '升级正在进行中，确定要中断升级吗？（设备可能处于不稳定状态）',
            '警告',
            {
                confirmButtonText: '确定中断',
                cancelButtonText: '取消',
                type: 'warning'
            }
        )
            .then(() => {
                visible.value = false // 会触发 watch，调用 resetState()
            })
            .catch(() => {
                // 用户取消，什么都不做
            })
    } else {
        // 正常关闭
        visible.value = false
    }
}
</script>

<style scoped>
.upgrade-modal-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.el-steps--simple {
    padding: 13px 8%;
    background-color: #f5f7fa;
    border-radius: 4px;
}

.progress-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}

.status-text {
    font-size: 14px;
    color: #606266;
}
</style>