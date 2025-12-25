<template>
    <div class="dashboard-card flex-col h-full">
        <div class="flex-between mb-6">
            <h3 class="text-base font-bold text-primary">实时动态</h3>
            <el-tag size="small" type="info" effect="plain">Live</el-tag>
        </div>

        <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div v-if="!activities?.length" class="text-center text-secondary py-8">
                暂无动态
            </div>

            <div v-for="(item, index) in activities" :key="item.id" class="activity-item group">
                <div class="timeline-line" v-if="index !== activities.length - 1"></div>

                <div class="timeline-dot" :class="`type-${item.type}`"></div>

                <div class="flex-1 pb-6">
                    <p class="text-sm text-primary mb-1">{{ item.content }}</p>
                    <div class="flex-between">
                        <span class="text-xs text-secondary">{{ item.time }}</span>

                        <el-button v-if="item.canDiagnose" type="primary" link size="small" class="diagnose-btn"
                            @click="$emit('diagnose', item)">
                            <el-icon class="mr-1">
                                <MagicStick />
                            </el-icon> AI 诊断
                        </el-button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { ActivityLogItem } from '@/types/dashboard';

defineProps<{
    activities: ActivityLogItem[]
}>();

defineEmits<{
    (e: 'diagnose', item: ActivityLogItem): void
}>();
</script>

<style scoped>
.text-primary {
    color: var(--text-primary);
}

.text-secondary {
    color: var(--text-secondary);
}

.activity-item {
    position: relative;
    display: flex;
    gap: 16px;
}

.timeline-line {
    position: absolute;
    left: 5px;
    /* dot width/2 - 1px */
    top: 16px;
    bottom: 0;
    width: 2px;
    background-color: var(--border-color);
}

.timeline-dot {
    position: relative;
    z-index: 1;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    margin-top: 4px;
    flex-shrink: 0;
    border: 2px solid #fff;
    box-shadow: 0 0 0 2px var(--color-slate-100);
}

/* 状态色点 */
.type-info {
    background-color: var(--color-blue-500);
}

.type-success {
    background-color: var(--color-success);
}

.type-warning {
    background-color: var(--color-warning);
    box-shadow: 0 0 0 2px var(--color-warning-bg);
}

.type-danger {
    background-color: var(--color-danger);
}

/* 诊断按钮动画 */
.diagnose-btn {
    opacity: 0;
    transform: translateX(10px);
    transition: all 0.3s ease;
}

.activity-item:hover .diagnose-btn {
    opacity: 1;
    transform: translateX(0);
}

/* 滚动条美化 */
.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: var(--color-slate-200);
    border-radius: 2px;
}
</style>