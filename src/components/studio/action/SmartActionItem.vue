<template>
    <div class="smart-action-card">
        <div class="index-badge">{{ index + 1 }}</div>

        <div class="content">
            <div class="main-row">
                <el-select v-model="modelValue.type" class="minimal-select" style="width: 120px">
                    <el-option label="设备控制" value="device_write" />
                    <el-option label="延时" value="delay" />
                    <el-option label="消息通知" value="notify" />
                </el-select>

                <div class="params-area">
                    <template v-if="modelValue.type === 'device_write'">
                        <span class="label">设置</span>
                        <el-input v-model="modelValue.params.targetDeviceId" placeholder="选择设备" class="bare-input" />
                    </template>

                    <template v-else-if="modelValue.type === 'delay'">
                        <span class="label">等待</span>
                        <el-input-number v-model="modelValue.params.delaySeconds" controls-position="right"
                            style="width: 100px" />
                        <span class="unit">秒</span>
                    </template>
                </div>
            </div>
        </div>

        <div class="remove-btn" @click="$emit('remove')">
            <el-icon>
                <Close />
            </el-icon>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Close } from '@element-plus/icons-vue';
import type { SceneAction } from '@/types/automation';

const props = defineProps<{
    modelValue: SceneAction;
    index: number;
}>();

const emit = defineEmits(['update:modelValue', 'remove']);
</script>

<style scoped lang="scss">
.smart-action-card {
    position: relative;
    display: flex;
    align-items: center;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    padding: 16px 16px 16px 12px;
    gap: 12px;
    transition: all 0.3s;
    z-index: 1;

    &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        border-color: var(--el-border-color);

        .remove-btn {
            opacity: 1;
        }

        .index-badge {
            background: var(--gold-primary, #d4af37);
            color: #000;
        }
    }
}

.index-badge {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--el-fill-color-dark);
    color: var(--el-text-color-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    flex-shrink: 0;
    transition: all 0.3s;
}

.content {
    flex: 1;
}

.main-row {
    display: flex;
    align-items: center;
    gap: 12px;
}

.params-area {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--el-fill-color-lighter);
    padding: 4px 12px;
    border-radius: 6px;

    .label {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        white-space: nowrap;
    }
}

.remove-btn {
    cursor: pointer;
    color: var(--el-text-color-placeholder);
    opacity: 0;
    transition: all 0.2s;

    &:hover {
        color: var(--el-color-danger);
    }
}

:deep(.bare-input .el-input__wrapper) {
    box-shadow: none !important;
    background: transparent;
    padding: 0;
}
</style>