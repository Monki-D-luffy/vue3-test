<template>
    <div class="action-builder">
        <div class="action-list">
            <div v-for="(action, index) in modelValue" :key="action.id" class="action-wrapper">
                <div class="step-connector" v-if="index > 0"></div>

                <SmartActionItem v-model="modelValue[index]!" :index="index" @remove="handleRemove(index)" />
            </div>

            <div v-if="modelValue.length === 0" class="empty-state">
                <span class="text">暂无执行动作，场景触发后将无事发生</span>
            </div>
        </div>

        <div class="footer-add">
            <el-button class="add-btn-dashed" @click="handleAdd">
                <el-icon>
                    <Plus />
                </el-icon>
                <span>添加执行动作</span>
            </el-button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue';
import type { SceneAction } from '@/types/automation';
import SmartActionItem from './SmartActionItem.vue';

const props = defineProps<{
    modelValue: SceneAction[];
}>();

const emit = defineEmits(['update:modelValue']);

const handleAdd = () => {
    const newAction: SceneAction = {
        id: `act_${Date.now()}`,
        type: 'device_write',
        displayText: '新动作',
        params: {}
    };
    emit('update:modelValue', [...props.modelValue, newAction]);
};

const handleRemove = (index: number) => {
    const newList = [...props.modelValue];
    newList.splice(index, 1);
    emit('update:modelValue', newList);
};
</script>

<style scoped lang="scss">
.action-builder {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.action-list {
    display: flex;
    flex-direction: column;
    gap: 0;
    /* Wrapper 处理间距 */
}

.action-wrapper {
    position: relative;
    padding-bottom: 12px;

    &:last-child {
        padding-bottom: 0;
    }
}

.step-connector {
    position: absolute;
    top: -12px;
    /* 向上延伸 */
    left: 24px;
    /* 对齐图标中心 */
    height: 12px;
    width: 2px;
    background: var(--el-border-color-lighter);
    z-index: 0;
}

.empty-state {
    text-align: center;
    padding: 20px;
    color: var(--el-text-color-placeholder);
    font-size: 13px;
    border: 1px dashed var(--el-border-color-lighter);
    border-radius: 8px;
}

.footer-add {
    margin-top: 4px;
}

.add-btn-dashed {
    width: 100%;
    border-style: dashed;
    color: var(--el-text-color-secondary);

    &:hover {
        color: var(--gold-primary, #d4af37);
        border-color: var(--gold-primary, #d4af37);
        background: var(--el-fill-color-light);
    }
}
</style>