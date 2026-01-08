<template>
    <div class="trigger-builder">
        <div class="logic-sentence-bar">
            <span class="prefix">当</span>

            <div class="toggle-group">
                <div class="toggle-item" :class="{ active: logic === 'AND' }" @click="emitLogic('AND')">
                    <span class="text">满足所有条件 (AND)</span>
                    <div class="active-indicator"></div>
                </div>

                <span class="divider">/</span>

                <div class="toggle-item" :class="{ active: logic === 'OR' }" @click="emitLogic('OR')">
                    <span class="text">满足任一条件 (OR)</span>
                    <div class="active-indicator"></div>
                </div>
            </div>

            <span class="suffix">时 :</span>
        </div>

        <div class="item-list">
            <SmartTriggerItem v-for="(trigger, index) in modelValue" :key="trigger.id" v-model="modelValue[index]"
                :index="index" @remove="handleRemove(index)" />
        </div>

        <button class="add-btn-minimal" @click="handleAdd">
            <el-icon>
                <Plus />
            </el-icon>
            <span>添加条件</span>
        </button>
    </div>
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue';
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

const emitLogic = (val: LogicType) => {
    emit('update:logic', val);
};

const handleAdd = () => {
    const newTrigger: SceneTrigger = {
        id: `trig_${Date.now()}`,
        type: 'device_dp',
        displayText: '新条件',
        params: {}
    };
    emit('update:modelValue', [...props.modelValue, newTrigger]);
};

const handleRemove = (index: number) => {
    const newList = [...props.modelValue];
    newList.splice(index, 1);
    emit('update:modelValue', newList);
};
</script>

<style scoped lang="scss">
.trigger-builder {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

/* 语义化逻辑栏 */
.logic-sentence-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 4px;
    height: 32px;
    font-size: 14px;
    color: #6b7280;
    /* Neutral gray */
    user-select: none;
}

.prefix,
.suffix {
    font-weight: 500;
    color: #9ca3af;
    /* Lighter gray for static words */
}

.toggle-group {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #f3f4f6;
    /* Subtle background */
    padding: 4px 8px;
    border-radius: 8px;
    transition: all 0.2s;

    &:hover {
        background: #e5e7eb;
    }
}

.divider {
    color: #d1d5db;
    font-size: 12px;
}

.toggle-item {
    position: relative;
    cursor: pointer;
    padding: 2px 4px;
    transition: all 0.2s;

    .text {
        font-weight: 600;
        color: #6b7280;
        font-size: 13px;
        transition: color 0.2s;
    }

    .active-indicator {
        position: absolute;
        bottom: -2px;
        left: 0;
        width: 0;
        height: 2px;
        background: #3b82f6;
        transition: width 0.2s ease;
        border-radius: 2px;
    }

    &:hover .text {
        color: #374151;
    }

    /* 激活状态 */
    &.active {
        .text {
            color: #3b82f6;
            /* Active Blue */
        }

        .active-indicator {
            width: 100%;
        }
    }
}

.item-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

/* 极简添加按钮 */
.add-btn-minimal {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    height: 36px;
    border: none;
    background: transparent;
    color: #9ca3af;
    font-size: 13px;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s;

    &:hover {
        background: #f9fafb;
        color: #3b82f6;
    }
}
</style>