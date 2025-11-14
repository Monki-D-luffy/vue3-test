<template>
    <el-dialog v-model="visible" width="420px" :show-close="false" :close-on-click-modal="!loading"
        class="verify-dialog" destroy-on-close align-center>
        <div class="verify-content">
            <div class="icon-wrapper">
                <div class="shield-bg">
                    <el-icon class="shield-icon">
                        <SuccessFilled />
                    </el-icon>
                </div>
                <div class="pulse-ring"></div>
            </div>

            <h3 class="title">验证版本 {{ firmware?.version }}</h3>
            <p class="description">
                确认将此固件标记为 <span class="highlight">"验证通过"</span> 吗？
                <br>
                验证后的固件将立即进入分发候选池，可用于批量升级任务。
            </p>

            <div class="info-card" v-if="firmware">
                <div class="info-row">
                    <span class="label">发布时间:</span>
                    <span class="value">{{ formatDateTime(firmware.uploadedAt) }}</span>
                </div>
                <div class="info-row">
                    <span class="label">文件大小:</span>
                    <span class="value">-- MB</span>
                </div>
            </div>

            <div class="actions">
                <el-button class="cancel-btn" @click="close" :disabled="loading">
                    暂不验证
                </el-button>
                <el-button type="success" class="confirm-btn" :loading="loading" @click="handleVerify">
                    {{ loading ? '验证中...' : '确认验证' }}
                </el-button>
            </div>
        </div>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { SuccessFilled } from '@element-plus/icons-vue'
import { formatDateTime } from '@/utils/formatters'
import { updateFirmware } from '@/api'
import { ElMessage } from 'element-plus'
import type { Firmware } from '@/types'

const props = defineProps<{
    modelValue: boolean
    firmware: Firmware | null
}>()

const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
})

const loading = ref(false)

const close = () => {
    visible.value = false
}

const handleVerify = async () => {
    if (!props.firmware) return

    loading.value = true
    try {
        // 调用 API 更新状态
        await updateFirmware(props.firmware.id, { verified: true })

        // 成功反馈
        ElMessage.success(`版本 ${props.firmware.version} 已通过验证`)
        emit('success')
        close()
    } catch (error) {
        // 错误处理交给拦截器或显示默认提示
        ElMessage.error('操作失败，请重试')
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>
/* 弹窗容器定制 */
:deep(.verify-dialog) {
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    padding: 0;
}

:deep(.verify-dialog .el-dialog__header) {
    display: none;
}

:deep(.verify-dialog .el-dialog__body) {
    padding: 0;
}

.verify-content {
    padding: 40px 32px 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    background: #fff;
}

/* 图标动画区 */
.icon-wrapper {
    position: relative;
    width: 80px;
    height: 80px;
    margin-bottom: 24px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.shield-bg {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: #dcfce7;
    /* 浅绿背景 */
    display: flex;
    justify-content: center;
    align-items: center;
    color: #16a34a;
    font-size: 40px;
}

.pulse-ring {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 2px solid #86efac;
    animation: pulse 2s infinite;
    z-index: 1;
}

@keyframes pulse {
    0% {
        width: 100%;
        height: 100%;
        opacity: 1;
    }

    100% {
        width: 160%;
        height: 160%;
        opacity: 0;
    }
}

/* 文本样式 */
.title {
    font-size: 20px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 12px 0;
}

.description {
    font-size: 14px;
    color: #64748b;
    line-height: 1.6;
    margin: 0 0 24px 0;
}

.highlight {
    color: #16a34a;
    font-weight: 600;
}

/* 信息卡片 */
.info-card {
    width: 100%;
    background: #f8fafc;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 32px;
    border: 1px solid #f1f5f9;
}

.info-row {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    margin-bottom: 8px;
}

.info-row:last-child {
    margin-bottom: 0;
}

.label {
    color: #94a3b8;
}

.value {
    color: #334155;
    font-weight: 500;
    font-family: monospace;
}

/* 按钮区 */
.actions {
    width: 100%;
    display: flex;
    gap: 12px;
}

.cancel-btn {
    flex: 1;
    height: 44px;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    color: #64748b;
    background: transparent;
}

.cancel-btn:hover {
    background: #f1f5f9;
    color: #334155;
}

.confirm-btn {
    flex: 1;
    height: 44px;
    border-radius: 10px;
    background: #16a34a;
    border-color: #16a34a;
    font-weight: 600;
    font-size: 15px;
}

.confirm-btn:hover {
    background: #15803d;
    border-color: #15803d;
}
</style>