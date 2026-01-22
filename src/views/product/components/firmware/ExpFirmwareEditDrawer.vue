<template>
    <el-drawer v-model="visible" title="固件版本详情" size="480px" append-to-body destroy-on-close class="firmware-drawer">
        <div v-if="localFirmware" class="drawer-content">
            <div class="info-card mb-6">
                <div class="header-row">
                    <div class="version-box">
                        <span class="v-label">VERSION</span>
                        <span class="v-val">v{{ localFirmware.version }}</span>
                    </div>
                    <el-tag :type="localFirmware.verified ? 'success' : 'warning'" effect="dark" size="small" round>
                        {{ localFirmware.verified ? '已验证' : '待验证' }}
                    </el-tag>
                </div>

                <div class="divider"></div>

                <div class="meta-grid">
                    <div class="meta-item">
                        <span class="label">固件库 ID</span>
                        <div class="value-row">
                            <span class="font-mono text-xs">{{ localFirmware.repoId?.substring(0, 12) }}...</span>
                            <el-icon class="copy-btn" @click="copyText(localFirmware.repoId)" title="复制 ID">
                                <CopyDocument />
                            </el-icon>
                        </div>
                    </div>
                    <div class="meta-item">
                        <span class="label">固件 Key</span>
                        <div class="value-row">
                            <span class="font-mono text-xs">{{ localFirmware.firmwareKey || 'N/A' }}</span>
                            <el-icon v-if="localFirmware.firmwareKey" class="copy-btn"
                                @click="copyText(localFirmware.firmwareKey)" title="复制 Key">
                                <CopyDocument />
                            </el-icon>
                        </div>
                    </div>
                    <div class="meta-item">
                        <span class="label">上传时间</span>
                        <span class="value">{{ formatDateTime(localFirmware.uploadedAt) }}</span>
                    </div>
                    <div class="meta-item">
                        <span class="label">文件大小</span>
                        <span class="value">{{ formatFileSize(localFirmware.fileSize) }}</span>
                    </div>
                </div>
            </div>

            <el-form label-position="top" class="edit-form">
                <el-form-item label="更新说明 (Release Notes)">
                    <el-input v-model="editNote" type="textarea" :rows="8" resize="none" placeholder="请输入版本更新日志..."
                        maxlength="500" show-word-limit />
                </el-form-item>
            </el-form>

            <div class="drawer-footer">
                <el-button @click="close" :disabled="loading">取消</el-button>
                <el-button type="primary" @click="handleSave" :loading="loading">
                    {{ loading ? '保存中...' : '保存修改' }}
                </el-button>
            </div>
        </div>
    </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { CopyDocument } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { formatDateTime } from '@/utils/formatters'
import { useFirmwareManagement } from '@/composables/useFirmwareManagement'
import type { Firmware } from '@/types'

const props = defineProps<{
    modelValue: boolean
    firmware: Firmware | null
}>()

const emit = defineEmits(['update:modelValue', 'success'])

const { updateAction, loading } = useFirmwareManagement()

const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
})

const localFirmware = ref<Firmware | null>(null)
const editNote = ref('')

// 监听传入数据，初始化本地状态
watch(() => props.firmware, (newVal) => {
    if (newVal) {
        localFirmware.value = { ...newVal }
        editNote.value = newVal.releaseNotes || ''
    }
}, { immediate: true })

const close = () => {
    visible.value = false
}

const handleSave = async () => {
    if (!localFirmware.value) return

    const success = await updateAction(localFirmware.value, editNote.value)
    if (success) {
        emit('success')
        close()
    }
}

const copyText = (text: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
}

// 辅助：格式化文件大小
const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<style scoped>
.firmware-drawer :deep(.el-drawer__header) {
    margin-bottom: 20px;
    border-bottom: 1px solid var(--el-border-color-light);
    padding-bottom: 20px;
}

.drawer-content {
    display: flex;
    flex-direction: column;
    height: 100%;
}

/* 信息卡片样式 */
.info-card {
    background: var(--bg-hover, #f8fafc);
    padding: 20px;
    border-radius: 12px;
    border: 1px solid var(--border-color-light, #e2e8f0);
}

.header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.version-box {
    display: flex;
    align-items: baseline;
    gap: 8px;
}

.v-label {
    font-size: 11px;
    font-weight: 700;
    color: var(--text-placeholder, #94a3b8);
    letter-spacing: 0.5px;
}

.v-val {
    font-family: 'JetBrains Mono', monospace;
    font-size: 20px;
    font-weight: 700;
    color: var(--text-primary, #1e293b);
}

.divider {
    height: 1px;
    background: var(--border-color-light, #e2e8f0);
    margin-bottom: 16px;
}

.meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}

.meta-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.meta-item .label {
    font-size: 12px;
    color: var(--text-secondary, #64748b);
}

.meta-item .value,
.value-row {
    font-size: 13px;
    color: var(--text-primary, #334155);
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
}

.copy-btn {
    cursor: pointer;
    color: var(--color-primary, #3b82f6);
    font-size: 14px;
    opacity: 0.8;
    transition: opacity 0.2s;
}

.copy-btn:hover {
    opacity: 1;
}

/* 底部按钮 */
.drawer-footer {
    margin-top: auto;
    padding-top: 24px;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    border-top: 1px solid var(--el-border-color-light);
}
</style>