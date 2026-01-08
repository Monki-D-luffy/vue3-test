<template>
    <div class="strategy-panel">
        <div class="panel-header">
            <h4 class="title">1. 功能绑定 (Features)</h4>
            <p class="desc">点击下方卡片，在右侧管理其定时任务。</p>
        </div>

        <div class="list-container custom-scrollbar">
            <transition-group name="list-anim">
                <div v-for="(dp, index) in modelValue" :key="dp.dpId" class="strategy-card"
                    :class="{ 'is-active': activeId === dp.dpId }" @click="handleCardClick(dp.dpId)">
                    <div class="card-row top">
                        <div class="info-block">
                            <span class="dp-name">{{ dp.name }}</span>
                            <span class="dp-tag">DP{{ dp.dpId }}</span>
                        </div>
                        <el-button type="danger" link icon="Delete" size="small" class="del-btn"
                            @click.stop="removeDp(index)" />
                    </div>
                    <div class="card-row bottom">
                        <span class="label">App别名:</span>
                        <el-input v-model="dp.alias" size="small" placeholder="默认名称" class="noir-input-ghost"
                            @click.stop />
                    </div>

                    <div class="active-indicator" v-if="activeId === dp.dpId"></div>
                </div>
            </transition-group>

            <div class="add-btn-wrapper" @click="showModal = true">
                <el-icon class="add-icon">
                    <Plus />
                </el-icon>
                <span>绑定新功能</span>
            </div>
        </div>

        <DpSelectModal v-model="showModal" :all-dps="allSourceDps" :exclude-ids="currentIds" @select="handleAddDp" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Plus, Delete } from '@element-plus/icons-vue';
import type { TimerActionDef } from '@/types/timer';
import DpSelectModal from './components/DpSelectModal.vue';

const props = defineProps<{
    modelValue: TimerActionDef[],
    allSourceDps: any[],
    activeId: number | null // 新增：接收当前选中的ID
}>();

const emit = defineEmits(['update:modelValue', 'select']);
const showModal = ref(false);

const currentIds = computed(() => props.modelValue.map(d => d.dpId));

const handleCardClick = (id: number) => {
    emit('select', id);
};

const handleAddDp = (rawDp: any) => {
    const newDp: TimerActionDef = {
        dpId: rawDp.id,
        code: rawDp.code,
        name: rawDp.name,
        type: rawDp.type,
        mode: rawDp.mode,
        selected: true,
        alias: ''
    };
    emit('update:modelValue', [...props.modelValue, newDp]);
    // 自动选中新添加的功能
    emit('select', newDp.dpId);
};

const removeDp = (index: number) => {
    const newList = [...props.modelValue];
    newList.splice(index, 1);
    emit('update:modelValue', newList);
};
</script>

<style scoped lang="scss">
.strategy-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 20px;
    background: #fcfcfc;
}

.panel-header {
    margin-bottom: 16px;
    flex-shrink: 0;
}

.title {
    font-size: 14px;
    font-weight: 700;
    color: #1a1a1a;
    margin: 0 0 4px 0;
}

.desc {
    font-size: 12px;
    color: #909399;
    margin: 0;
}

.list-container {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    padding-right: 6px;
    padding-bottom: 20px;
}

.strategy-card {
    background: #fff;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 10px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
    transition: all 0.2s ease;
    position: relative;
    cursor: pointer;
    overflow: hidden;

    &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        border-color: #c0c4cc;
        transform: translateY(-1px);
    }

    &.is-active {
        border-color: #d4af37;
        background: #fffcf5;
        box-shadow: 0 4px 12px rgba(212, 175, 55, 0.08);

        .dp-name {
            color: #d4af37;
        }
    }
}

.active-indicator {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: #d4af37;
}

.card-row {
    display: flex;
    align-items: center;
    justify-content: space-between;

    &.top {
        margin-bottom: 8px;
    }

    &.bottom {
        gap: 8px;
    }
}

.info-block {
    display: flex;
    align-items: center;
    gap: 8px;
}

.dp-name {
    font-size: 13px;
    font-weight: 600;
    color: #333;
    transition: color 0.2s;
}

.dp-tag {
    font-size: 10px;
    color: #909399;
    background: #f4f4f5;
    padding: 1px 4px;
    border-radius: 3px;
    font-family: monospace;
}

.label {
    font-size: 12px;
    color: #909399;
    white-space: nowrap;
}

.add-btn-wrapper {
    margin-top: 8px;
    border: 1px dashed #dcdfe6;
    border-radius: 8px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #606266;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 13px;
    background: #fff;
    gap: 6px;

    &:hover {
        border-color: #d4af37;
        color: #d4af37;
        background: #fffcf5;
    }
}

.del-btn {
    opacity: 0;
    transition: opacity 0.2s;
}

.strategy-card:hover .del-btn {
    opacity: 1;
}

/* 列表动画 */
.list-anim-enter-active,
.list-anim-leave-active {
    transition: all 0.3s ease;
}

.list-anim-enter-from,
.list-anim-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}

:deep(.noir-input-ghost .el-input__wrapper) {
    box-shadow: none;
    padding: 0 4px;
    border-bottom: 1px solid #eee;
    background: transparent;
    border-radius: 0;

    &.is-focus {
        box-shadow: none !important;
        border-bottom-color: #d4af37;
    }
}
</style>