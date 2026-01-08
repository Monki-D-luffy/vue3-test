<template>
    <div class="smart-action-item">
        <el-select v-model="modelValue.type" class="action-type-select" @change="handleTypeChange" :disabled="readonly">
            <template #prefix>
                <el-icon>
                    <component :is="getTypeIcon(modelValue.type)" />
                </el-icon>
            </template>
            <el-option label="设备控制" value="device_write" />
            <el-option label="延时等待" value="delay" />
            <el-option label="发送通知" value="notify" />
        </el-select>

        <div class="action-content">

            <template v-if="modelValue.type === 'device_write'">
                <el-select v-model="modelValue.params.targetDeviceId" placeholder="选择设备" class="device-select"
                    filterable>
                    <el-option v-for="dev in deviceOptions" :key="dev.id" :label="dev.name" :value="dev.id" />
                </el-select>

                <el-select v-model="modelValue.params.dpId" placeholder="功能点" class="dp-select"
                    :disabled="!modelValue.params.targetDeviceId" @change="handleDpChange">
                    <el-option label="开关 (Switch)" value="1" />
                    <el-option label="温度 (Temp)" value="2" />
                    <el-option label="模式 (Mode)" value="3" />
                </el-select>

                <div class="value-setter" v-if="modelValue.params.dpId">
                    <span class="operator">:=</span>

                    <el-switch v-if="modelValue.params.dpId === '1'" v-model="modelValue.params.value" inline-prompt
                        active-text="ON" inactive-text="OFF" />

                    <div v-else-if="modelValue.params.dpId === '2'" class="flex items-center">
                        <el-slider v-model="modelValue.params.value" :min="16" :max="30"
                            style="width: 100px; margin-right: 12px" />
                        <span class="unit-text">{{ modelValue.params.value }}℃</span>
                    </div>

                    <el-radio-group v-else-if="modelValue.params.dpId === '3'" v-model="modelValue.params.value"
                        size="small">
                        <el-radio-button value="Cool">制冷</el-radio-button>
                        <el-radio-button value="Heat">制热</el-radio-button>
                    </el-radio-group>
                </div>
            </template>

            <template v-else-if="modelValue.type === 'delay'">
                <el-input-number v-model="modelValue.params.delaySeconds" :min="1" :max="3600" controls-position="right"
                    style="width: 120px" />
                <span class="unit-text">秒</span>
            </template>

            <template v-else-if="modelValue.type === 'notify'">
                <el-input v-model="modelValue.params.message" placeholder="请输入通知内容..." style="width: 240px" />
            </template>
        </div>

        <div class="action-ops">
            <el-button v-if="!readonly" type="danger" link icon="Delete" @click="$emit('remove')" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Connection, Timer, Bell, Delete } from '@element-plus/icons-vue';
import type { SceneAction, ActionType } from '@/types/automation';

const props = defineProps<{
    modelValue: SceneAction;
    readonly?: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', val: SceneAction): void;
    (e: 'remove'): void;
}>();

const deviceOptions = [
    { id: 'dev_1', name: '客厅主灯' },
    { id: 'dev_2', name: '智能空调' },
    { id: 'dev_3', name: '加湿器' }
];

const getTypeIcon = (type: ActionType) => {
    const map: Record<string, any> = {
        device_write: Connection,
        delay: Timer,
        notify: Bell
    };
    return map[type] || Connection;
};

const handleTypeChange = (newType: string) => {
    props.modelValue.params = {};
    if (newType === 'delay') {
        props.modelValue.params.delaySeconds = 5;
        props.modelValue.displayText = '延时 5秒';
    }
};

const handleDpChange = () => {
    props.modelValue.params.value = undefined;
};
</script>

<style scoped>
.smart-action-item {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color);
    border-left: 3px solid var(--el-color-success);
    border-radius: 6px;
    padding: 12px;
    transition: all 0.2s;
    margin-bottom: 8px;
}

.smart-action-item:hover {
    border-color: var(--el-color-success-light-5);
    box-shadow: var(--shadow-card);
}

.action-type-select {
    width: 130px;
    flex-shrink: 0;
}

.action-content {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.device-select {
    width: 150px;
}

.dp-select {
    width: 130px;
}

.value-setter {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--el-fill-color-lighter);
    padding: 4px 12px;
    border-radius: 4px;
}

.operator {
    font-family: monospace;
    font-weight: bold;
    color: var(--el-color-success);
}

.unit-text {
    font-size: 13px;
    color: var(--el-text-color-regular);
}

.action-ops {
    margin-left: auto;
}
</style>