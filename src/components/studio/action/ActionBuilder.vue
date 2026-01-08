<template>
    <div class="action-builder">
        <div class="builder-header">
            <span class="label">执行以下动作 (按顺序)</span>
        </div>

        <div class="action-list">
            <SmartActionItem v-for="(action, index) in modelValue" :key="action.id" v-model="modelValue[index]"
                @remove="handleRemove(index)" />

            <div v-if="modelValue.length === 0" class="empty-action">
                <el-icon :size="24" color="#67c23a">
                    <VideoPlay />
                </el-icon>
                <p>暂无执行动作</p>
            </div>
        </div>

        <div class="builder-footer">
            <el-button type="success" plain style="width: 100%" icon="Plus" @click="handleAdd">
                添加执行动作
            </el-button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Plus, VideoPlay } from '@element-plus/icons-vue';
import type { SceneAction } from '@/types/automation';
import SmartActionItem from './SmartActionItem.vue';

const props = defineProps<{
    modelValue: SceneAction[];
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', val: SceneAction[]): void;
}>();

const handleAdd = () => {
    const newAction: SceneAction = {
        id: `act_${Date.now()}`,
        type: 'device_write',
        displayText: '新动作',
        params: {}
    };
    const newList = [...props.modelValue, newAction];
    emit('update:modelValue', newList);
};

const handleRemove = (index: number) => {
    const newList = [...props.modelValue];
    newList.splice(index, 1);
    emit('update:modelValue', newList);
};
</script>

<style scoped>
.action-builder {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.builder-header {
    margin-bottom: 4px;
}

.label {
    font-weight: 600;
    color: var(--el-text-color-primary);
}

.action-list {
    display: flex;
    flex-direction: column;
    min-height: 60px;
}

.empty-action {
    border: 1px dashed var(--el-border-color);
    border-radius: 8px;
    padding: 24px;
    text-align: center;
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color-extra-light);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}
</style>