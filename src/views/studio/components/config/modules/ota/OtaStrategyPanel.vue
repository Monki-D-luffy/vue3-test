<template>
    <div class="strategy-panel">


        <div class="setting-group">
            <div class="group-header">
                <div class="header-left">
                    <el-icon class="header-icon">
                        <Operation />
                    </el-icon>
                    <span class="header-title">默认升级模式</span>
                </div>
            </div>

            <div class="mode-list">
                <div v-for="mode in UPGRADE_MODES" :key="mode.value" class="mode-item"
                    :class="{ 'is-selected': modelValue.upgradeMode === mode.value }"
                    @click="modelValue.upgradeMode = mode.value">
                    <div class="mode-radio">
                        <div class="radio-inner" v-if="modelValue.upgradeMode === mode.value"></div>
                    </div>
                    <div class="mode-content">
                        <span class="mode-label">{{ mode.label }}</span>
                        <span class="mode-desc">{{ mode.desc }}</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="setting-group">
            <div class="group-header">
                <div class="header-left">
                    <el-icon class="header-icon">
                        <Timer />
                    </el-icon>
                    <span class="header-title">自动检测更新</span>
                </div>
                <el-switch v-model="modelValue.autoCheck" style="--el-switch-on-color: #10b981" />
            </div>

            <div class="group-content" :class="{ 'is-collapsed': !modelValue.autoCheck }">
                <p class="helper-text">设备将在后台周期性检查新固件。</p>
                <el-row :gutter="12">
                    <el-col :span="12">
                        <div class="input-wrapper">
                            <span class="input-label">检测周期</span>
                            <el-input-number v-model="modelValue.checkInterval" :min="1" :max="365"
                                controls-position="right" class="noir-input-number" :disabled="!modelValue.autoCheck">
                                <template #suffix>天</template>
                            </el-input-number>
                        </div>
                    </el-col>
                    <el-col :span="12">
                        <div class="input-wrapper">
                            <span class="input-label">失败重试</span>
                            <el-input-number v-model="modelValue.retryCount" :min="0" :max="10"
                                controls-position="right" class="noir-input-number" :disabled="!modelValue.autoCheck">
                                <template #suffix>次</template>
                            </el-input-number>
                        </div>
                    </el-col>
                </el-row>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Timer, Operation } from '@element-plus/icons-vue';
import type { OtaPolicy } from '@/types/product-config';

defineProps<{ modelValue: OtaPolicy }>();
defineEmits(['update:modelValue']);

const UPGRADE_MODES: { value: OtaPolicy['upgradeMode']; label: string; desc: string }[] = [
    { value: 'remind', label: '提醒升级 (Remind)', desc: 'App 弹窗提示，用户确认后开始下载。' },
    { value: 'force', label: '强制升级 (Force)', desc: '设备检测到更新后立即锁定并升级。' },
    { value: 'silent', label: '静默升级 (Silent)', desc: '在夜间闲时自动下载并安装。' }
];
</script>

<style scoped lang="scss">
.strategy-panel {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.setting-group {
    background: #fff;
    border: 1px solid #e4e7ed;
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.3s;

    &:hover {
        border-color: #dcdfe6;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
    }
}

.group-header {
    padding: 16px;
    background: #fcfcfc;
    border-bottom: 1px solid #f0f2f5;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-left {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        color: #1a1a1a;
        font-size: 14px;
    }

    .header-icon {
        font-size: 16px;
        color: #909399;
    }
}

.group-content {
    padding: 16px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    max-height: 200px;
    opacity: 1;

    &.is-collapsed {
        max-height: 0;
        opacity: 0;
        padding-top: 0;
        padding-bottom: 0;
        overflow: hidden;
    }
}

.helper-text {
    font-size: 12px;
    color: #909399;
    margin: 0 0 16px 0;
    line-height: 1.4;
}

.input-wrapper {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.input-label {
    font-size: 12px;
    color: #606266;
    font-weight: 500;
}

/* 紧凑列表样式 */
.mode-list {
    display: flex;
    flex-direction: column;
}

.mode-item {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    cursor: pointer;
    border-bottom: 1px solid #f5f7fa;
    transition: background 0.2s;
    position: relative;

    &:last-child {
        border-bottom: none;
    }

    &:hover {
        background: #f9fafc;
    }

    &.is-selected {
        background: #fffdf5; // 淡淡的金色背景

        .mode-label {
            color: #d4af37;
            font-weight: 600;
        }

        .mode-radio {
            border-color: #d4af37;
        }
    }
}

.mode-radio {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 1px solid #dcdfe6;
    margin-right: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
}

.radio-inner {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #d4af37;
}

.mode-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.mode-label {
    font-size: 13px;
    color: #303133;
    transition: color 0.2s;
}

.mode-desc {
    font-size: 12px;
    color: #909399;
}

.selected-tag {
    background-color: #1f1f1f;
    border-color: #1f1f1f;
    color: #d4af37;
}

/* 覆盖 Element InputNumber 样式 */
:deep(.noir-input-number.el-input-number) {
    width: 100%;

    .el-input__wrapper {
        box-shadow: none;
        background: #f5f7fa;
        padding-right: 40px;
        /* 给 suffix 留空间 */
    }

    .el-input__inner {
        text-align: left;
    }

    /* 隐藏右侧加减号，使其看起来像原生输入框 (可选) */
    /* .el-input-number__decrease, .el-input-number__increase { display: none; } */
}
</style>