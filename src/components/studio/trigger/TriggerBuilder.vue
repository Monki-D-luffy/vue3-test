<template>
    <div class="trigger-builder">
        <div class="builder-header">
            <span class="label">当</span>
            <el-radio-group v-model="internalLogic" size="small" @change="emitChange">
                <el-radio-button value="AND">满足所有条件</el-radio-button>
                <el-radio-button value="OR">满足任一条件</el-radio-button>
            </el-radio-group>
        </div>

        <div class="trigger-list">
            <SmartTriggerItem v-for="(trigger, index) in modelValue" :key="trigger.id" v-model="modelValue[index]"
                @remove="handleRemove(index)" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Plus, Warning } from '@element-plus/icons-vue';
import type { SceneTrigger, LogicType } from '@/types/automation';
import SmartTriggerItem from './SmartTriggerItem.vue';

const props = defineProps<{
    modelValue: SceneTrigger[];
    logic: LogicType;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', val: SceneTrigger[]): void;
    (e: 'update:logic', val: LogicType): void;
}>();

const internalLogic = ref<LogicType>(props.logic);

watch(() => props.logic, (val) => {
    internalLogic.value = val;
});

const emitChange = () => {
    emit('update:logic', internalLogic.value);
};

const handleAdd = () => {
    const newTrigger: SceneTrigger = {
        id: `trig_${Date.now()}`,
        type: 'device_dp',
        displayText: '新条件',
        params: {}
    };
    const newList = [...props.modelValue, newTrigger];
    emit('update:modelValue', newList);
};

const handleRemove = (index: number) => {
    const newList = [...props.modelValue];
    newList.splice(index, 1);
    emit('update:modelValue', newList);
};
</script>

<style scoped>
.trigger-builder {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.builder-header {
    display: flex;
    align-items: center;
    gap: 12px;
}

.label {
    font-weight: 600;
    color: var(--el-text-color-primary);
}

.trigger-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 60px;
}

.empty-trigger {
    border: 1px dashed var(--el-border-color);
    border-radius: 8px;
    padding: 24px;
    text-align: center;
    color: var(--el-text-color-secondary);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}
</style>