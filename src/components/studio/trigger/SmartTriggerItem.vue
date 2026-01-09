<template>
    <div class="trigger-card">
        <div class="card-left">
            <div class="drag-dots">⋮⋮</div>
            <div class="type-icon">
                <el-icon>
                    <Cpu />
                </el-icon>
            </div>
        </div>

        <div class="card-main">
            <div class="logic-group">
                <span class="label">设备</span>
                <el-input v-model="modelValue.params.deviceId" placeholder="选择设备..." class="inline-input bold-input" />
            </div>

            <div class="logic-group">
                <div class="condition-chip">
                    <span class="chip-label">属性</span>
                    <el-input v-model="modelValue.params.dpId" placeholder="如: Switch" class="chip-input" />
                </div>

                <span class="operator">==</span>

                <div class="condition-chip value-chip">
                    <el-input v-model="modelValue.params.value" placeholder="值" class="chip-input" />
                </div>
            </div>
        </div>

        <div class="card-right">
            <el-button link class="del-btn" @click="$emit('remove')">
                <el-icon>
                    <Close />
                </el-icon>
            </el-button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Cpu, Close } from '@element-plus/icons-vue';
import type { SceneTrigger } from '@/types/automation';

const props = defineProps<{
    modelValue: SceneTrigger;
    index: number;
}>();

const emit = defineEmits(['remove']);
</script>

<style scoped lang="scss">
.trigger-card {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: all 0.2s ease;

    &:hover {
        border-color: #d1d5db;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        transform: translateY(-1px);

        .del-btn {
            opacity: 1;
        }
    }
}

.card-left {
    display: flex;
    align-items: center;
    gap: 8px;

    .drag-dots {
        color: #d1d5db;
        cursor: grab;
        font-size: 12px;
        letter-spacing: -1px;

        &:active {
            cursor: grabbing;
        }
    }

    .type-icon {
        width: 32px;
        height: 32px;
        background: #f3f4f6;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #6b7280;
    }
}

/* 核心修改区域：改为横向布局 */
.card-main {
    flex: 1;
    display: flex;
    flex-direction: row;
    /* 改为 Row */
    align-items: center;
    /* 垂直居中 */
    flex-wrap: wrap;
    /* 允许换行，防止窄屏溢出 */
    gap: 16px;
    /* 增加组间距 */
}

/* 原 row-top 和 row-bottom 统一样式 */
.logic-group {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #6b7280;

    .label {
        font-weight: 500;
        white-space: nowrap;
        /* 防止“设备”二字竖排 */
    }
}

/* 胶囊式输入框 */
.condition-chip {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 2px 8px;
    display: flex;
    align-items: center;
    gap: 6px;
    height: 28px;
    transition: border 0.2s;

    .chip-label {
        font-size: 11px;
        color: #9ca3af;
        font-weight: 600;
        white-space: nowrap;
        /* 防止“属性”二字竖排 */
    }

    &:focus-within {
        border-color: #3b82f6;
        background: #eff6ff;
    }
}

.value-chip {
    background: #ecfdf5;
    border-color: #d1fae5;

    &:focus-within {
        border-color: #10b981;
        background: #d1fae5;
    }
}

.operator {
    font-weight: 700;
    color: #d1d5db;
    font-size: 12px;
}

.card-right {
    .del-btn {
        opacity: 0;
        transition: opacity 0.2s;
        color: #9ca3af;

        &:hover {
            color: #ef4444;
        }
    }
}

/* Element Plus Input Overrides */
:deep(.inline-input .el-input__wrapper) {
    box-shadow: none !important;
    padding: 0;
    background: transparent;
}

/* 给设备输入框一个最大宽度，避免撑满一行导致属性掉下去 */
:deep(.inline-input) {
    width: 120px;
    max-width: 150px;
}

:deep(.bold-input input) {
    font-weight: 600;
    color: #1f2937;
}

:deep(.chip-input .el-input__wrapper) {
    box-shadow: none !important;
    padding: 0;
    background: transparent;
    width: 80px;
}

:deep(.chip-input input) {
    font-size: 12px;
    height: 24px;
}
</style>