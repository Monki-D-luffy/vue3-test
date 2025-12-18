<template>
    <div class="extra-widgets">
        <div class="widget-row">
            <div class="label">
                <el-icon>
                    <RefreshRight />
                </el-icon>
                <span>循环发送</span>
            </div>

            <div class="controls">
                <el-input-number v-model="cycleInterval" :min="10" :step="100" size="small" controls-position="right"
                    class="interval-input" :disabled="isCycling" />
                <span class="unit">ms</span>
                <el-switch v-model="isCycling" :disabled="!isConnected" @change="toggleCycle" size="small" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { RefreshRight } from '@element-plus/icons-vue'
import { useSerialPort } from '@/composables/useSerialPort'

const { isConnected, isCycling, cycleInterval, toggleCycle } = useSerialPort()
</script>

<style scoped>
.extra-widgets {
    background: var(--el-bg-color-overlay);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    padding: 8px 12px;
}

.widget-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: var(--el-text-color-primary);
}

.controls {
    display: flex;
    align-items: center;
    gap: 8px;
}

.interval-input {
    width: 80px !important;
}

.unit {
    font-size: 11px;
    color: var(--el-text-color-secondary);
}

/* 兼容暗黑模式下的细微边框 */
html.dark .extra-widgets {
    border-color: var(--el-border-color-darker);
}
</style>