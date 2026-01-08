<template>
    <div class="smart-trigger-item">
        <el-select v-model="modelValue.type" class="trigger-type-select" @change="handleTypeChange"
            :disabled="readonly">
            <template #prefix>
                <el-icon>
                    <component :is="getTypeIcon(modelValue.type)" />
                </el-icon>
            </template>
            <el-option label="设备状态" value="device_dp" />
            <el-option label="定时任务" value="timer" />
            <el-option label="手动触发" value="manual" />
        </el-select>

        <div class="trigger-content">

            <template v-if="modelValue.type === 'device_dp'">
                <el-select v-model="modelValue.params.deviceId" placeholder="选择设备" class="device-select" filterable>
                    <el-option v-for="dev in deviceOptions" :key="dev.id" :label="dev.name" :value="dev.id" />
                </el-select>

                <el-select v-model="modelValue.params.dpId" placeholder="功能点" class="dp-select"
                    :disabled="!modelValue.params.deviceId">
                    <el-option label="开关 (Switch)" value="1" />
                    <el-option label="温度 (Temp)" value="2" />
                    <el-option label="模式 (Mode)" value="3" />
                </el-select>

                <div class="value-logic" v-if="modelValue.params.dpId">
                    <template v-if="modelValue.params.dpId === '1'">
                        <span class="operator">==</span>
                        <el-switch v-model="modelValue.params.value" inline-prompt active-text="ON"
                            inactive-text="OFF" />
                    </template>

                    <template v-else-if="modelValue.params.dpId === '2'">
                        <el-select v-model="modelValue.params.operator" style="width: 80px">
                            <el-option label=">" value=">" />
                            <el-option label="<" value="<" />
                            <el-option label="=" value="==" />
                        </el-select>
                        <el-input-number v-model="modelValue.params.value" :min="0" :max="100" controls-position="right"
                            style="width: 100px" />
                        <span class="unit">℃</span>
                    </template>
                </div>
            </template>

            <template v-else-if="modelValue.type === 'timer'">
                <el-time-picker v-model="tempTime" format="HH:mm" placeholder="选择时间" style="width: 140px"
                    @change="handleTimeChange" />
                <div class="repeat-tag">每天</div>
            </template>

            <template v-else-if="modelValue.type === 'manual'">
                <el-tag type="info" class="manual-tag">
                    <el-icon>
                        <Pointer />
                    </el-icon> 点击卡片以运行
                </el-tag>
            </template>
        </div>

        <el-button v-if="!readonly" type="danger" link icon="Delete" class="delete-btn" @click="$emit('remove')" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Timer, Connection, Pointer, Delete } from '@element-plus/icons-vue';
import type { SceneTrigger, TriggerType } from '@/types/automation';

const props = defineProps<{
    modelValue: SceneTrigger;
    readonly?: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', val: SceneTrigger): void;
    (e: 'remove'): void;
}>();

// --- Mock Data (实际项目应从 Store 获取) ---
const deviceOptions = [
    { id: 'dev_1', name: '客厅主灯' },
    { id: 'dev_2', name: '温湿度传感器' },
    { id: 'dev_3', name: '智能空调' }
];

// --- Helpers ---
const tempTime = ref<Date>();

const getTypeIcon = (type: TriggerType) => {
    const map: Record<string, any> = {
        device_dp: Connection,
        timer: Timer,
        manual: Pointer
    };
    return map[type] || Connection;
};

// --- Handlers ---
const handleTypeChange = (newType: string) => {
    // 重置 params 以防止数据污染
    props.modelValue.params = {};
    if (newType === 'timer') {
        props.modelValue.displayText = '每天 00:00';
    } else if (newType === 'manual') {
        props.modelValue.displayText = '手动触发';
    }
};

const handleTimeChange = (val: Date) => {
    if (!val) return;
    const timeStr = `${val.getHours().toString().padStart(2, '0')}:${val.getMinutes().toString().padStart(2, '0')}`;
    props.modelValue.params.cron = `0 ${val.getMinutes()} ${val.getHours()} * * ?`; // 简易Cron
    props.modelValue.displayText = `每天 ${timeStr}`;
};
</script>

<style scoped>
.smart-trigger-item {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--el-fill-color-blank);
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    padding: 12px;
    transition: all 0.2s;
}

.smart-trigger-item:hover {
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.trigger-type-select {
    width: 140px;
    flex-shrink: 0;
}

.trigger-content {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.device-select {
    width: 160px;
}

.dp-select {
    width: 140px;
}

.value-logic {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--el-fill-color-lighter);
    padding: 4px 8px;
    border-radius: 4px;
}

.operator {
    font-family: monospace;
    font-weight: bold;
    color: var(--el-color-primary);
}

.unit {
    font-size: 12px;
    color: var(--el-text-color-secondary);
}

.delete-btn {
    opacity: 0;
    transition: opacity 0.2s;
}

.smart-trigger-item:hover .delete-btn {
    opacity: 1;
}

/* 移动端适配 */
@media (max-width: 768px) {
    .smart-trigger-item {
        flex-direction: column;
        align-items: stretch;
    }

    .trigger-type-select,
    .device-select,
    .dp-select {
        width: 100% !important;
    }

    .delete-btn {
        opacity: 1;
        align-self: flex-end;
    }
}
</style>