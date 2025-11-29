<template>
    <el-dialog v-model="visible" width="420px" :show-close="false" :close-on-click-modal="!loading"
        class="delete-dialog" destroy-on-close align-center>
        <div class="delete-content">
            <div class="icon-wrapper">
                <div class="danger-bg">
                    <el-icon class="danger-icon">
                        <DeleteFilled />
                    </el-icon>
                </div>
                <div class="pulse-ring"></div>
            </div>

            <h3 class="title">删除版本 {{ firmware?.version }} ?</h3>
            <p class="description">
                此操作将永久删除该固件文件及相关记录。
                <br>
                <span class="warning-text">删除后无法恢复，且无法再推送给设备。</span>
            </p>

            <div class="info-card" v-if="firmware">
                <div class="info-row">
                    <span class="label">发布说明:</span>
                    <div class="value note" :title="firmware.releaseNotes">
                        {{ firmware.releaseNotes || '无' }}
                    </div>
                </div>
                <div class="info-row">
                    <span class="label">上传时间:</span>
                    <span class="value">{{ formatDateTime(firmware.uploadedAt) }}</span>
                </div>
            </div>

            <div class="actions">
                <el-button class="cancel-btn" @click="close" :disabled="loading">
                    取消
                </el-button>
                <el-button type="danger" class="confirm-btn" :loading="loading" @click="handleDelete">
                    {{ loading ? '删除中...' : '确认删除' }}
                </el-button>
            </div>
        </div>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { DeleteFilled } from '@element-plus/icons-vue'
import { formatDateTime } from '@/utils/formatters'
import { ElMessage } from 'element-plus'
import type { Firmware } from '@/types'
import { useFirmwareManagement } from '@/composables/useFirmwareManagement'

const props = defineProps<{
    modelValue: boolean
    firmware: Firmware | null
}>()

const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
})

const { removeFirmwarePure } = useFirmwareManagement()

const loading = ref(false)

const close = () => {
    visible.value = false
}

const handleDelete = async () => {
    if (!props.firmware) return

    loading.value = true
    try {

        await removeFirmwarePure(props.firmware.id)
        ElMessage.success('删除成功')
        emit('success')
        close()
    } catch (error) {
        ElMessage.error('删除失败，请重试')
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>
/* 弹窗容器定制 */
:deep(.delete-dialog) {
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    padding: 0;
}

:deep(.delete-dialog .el-dialog__header) {
    display: none;
}

:deep(.delete-dialog .el-dialog__body) {
    padding: 0;
}

.delete-content {
    padding: 40px 32px 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    background: #fff;
}

/* 图标动画区 - 红色系 */
.icon-wrapper {
    position: relative;
    width: 80px;
    height: 80px;
    margin-bottom: 24px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.danger-bg {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: #fee2e2;
    /* 浅红背景 */
    display: flex;
    justify-content: center;
    align-items: center;
    color: #ef4444;
    /* 红色图标 */
    font-size: 36px;
}

.pulse-ring {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 2px solid #fca5a5;
    animation: pulse-red 2s infinite;
    z-index: 1;
}

@keyframes pulse-red {
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

.warning-text {
    color: #ef4444;
    font-weight: 500;
}

/* 信息卡片 */
.info-card {
    width: 100%;
    background: #fff1f2;
    /* 极淡的红底 */
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 32px;
    border: 1px solid #ffe4e6;
}

.info-row {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    margin-bottom: 8px;
    align-items: flex-start;
    /* 对齐多行文本 */
}

.info-row:last-child {
    margin-bottom: 0;
}

.label {
    color: #94a3b8;
    white-space: nowrap;
    margin-right: 10px;
}

.value {
    color: #334155;
    font-weight: 500;
    font-family: monospace;
    text-align: right;
}

.value.note {
    font-family: inherit;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
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
    background: #ef4444;
    border-color: #ef4444;
    font-weight: 600;
    font-size: 15px;
}

.confirm-btn:hover {
    background: #dc2626;
    border-color: #dc2626;
}
</style>