<template>
    <el-dialog :model-value="modelValue" @update:model-value="(val: boolean) => $emit('update:modelValue', val)"
        width="420px" destroy-on-close class="modern-unbind-dialog" :show-close="false" align-center>
        <div class="unbind-content-wrapper">
            <div class="danger-icon-box">
                <el-icon>
                    <WarningFilled />
                </el-icon>
            </div>
            <h3 class="unbind-title">确认解除绑定?</h3>
            <p class="unbind-target">
                您正在操作设备：<span class="target-name">{{ device?.name }}</span>
            </p>
            <p class="unbind-description">
                解绑后设备将<b>停止数据上报</b>，且无法再通过平台进行管理。此操作通常不可逆，请谨慎操作。
            </p>
        </div>
        <template #footer>
            <div class="dialog-footer centered-footer">
                <el-button @click="close" size="large" class="action-btn">取 消</el-button>
                <el-button type="danger" @click="handleConfirm" size="large" class="action-btn" :loading="loading">
                    确认解绑
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { WarningFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { Device } from '@/types'
// 🔥 引入真实的 API 方法
import { deleteDevice } from '@/api'

// 接收 props
const props = defineProps<{
    modelValue: boolean
    device: Device | null
}>()

// 定义事件
const emit = defineEmits<{
    (e: 'update:modelValue', val: boolean): void
    (e: 'success'): void // 解绑成功事件
}>()

const loading = ref(false)

const close = () => {
    emit('update:modelValue', false)
}

const handleConfirm = async () => {
    if (!props.device) return

    loading.value = true
    try {
        // 🔥🔥 核心修复：调用真实 API
        await deleteDevice(props.device.id)

        ElMessage.success(`设备【${props.device.name}】已成功解绑`)

        // 1. 通知父组件刷新数据
        emit('success')
        // 2. 关闭弹窗
        close()
    } catch (error) {
        // 错误已经在 axios 拦截器处理过了，这里可以只处理 Loading 状态
        console.error('解绑失败', error)
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>
/* 复用之前的现代化样式 */
:global(.modern-unbind-dialog .el-dialog__header) {
    display: none;
}

:global(.modern-unbind-dialog .el-dialog__body) {
    padding: 32px 24px 16px;
}

:global(.modern-unbind-dialog .el-dialog__footer) {
    padding: 16px 24px 24px;
    border-top: none;
}

.unbind-content-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
}

.danger-icon-box {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background-color: var(--el-color-danger-light-9);
    color: var(--el-color-danger);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    margin-bottom: 16px;
}

.unbind-title {
    font-size: 20px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 12px;
}

.unbind-target {
    font-size: 15px;
    color: #475569;
    margin: 0 0 12px;
}

.target-name {
    font-weight: 600;
    color: #1e293b;
}

.unbind-description {
    font-size: 13px;
    color: #94a3b8;
    line-height: 1.5;
    margin: 0;
    max-width: 80%;
}

.centered-footer {
    display: flex;
    justify-content: center;
    gap: 12px;
    width: 100%;
}

.action-btn {
    flex: 1;
    max-width: 140px;
    border-radius: 8px;
    font-weight: 600;
}
</style>