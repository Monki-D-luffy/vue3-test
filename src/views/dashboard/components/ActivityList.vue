<template>
    <div class="activity-card">
        <div class="activity-header">
            <h3 class="activity-title">实时动态</h3>
            <div class="live-tag">
                <span class="live-dot"></span>
                LIVE
            </div>
        </div>

        <div class="activity-list custom-scrollbar">
            <div v-for="(item, index) in activities" :key="item.id" class="activity-item">
                <div v-if="index !== activities.length - 1" class="timeline-line"></div>

                <div class="timeline-dot" :class="`is-${item.type}`"></div>

                <div class="activity-content">
                    <p class="activity-text">{{ item.content }}</p>
                    <div class="activity-info">
                        <span class="activity-time">{{ item.time }}</span>
                        <button v-if="item.canDiagnose" class="diagnose-link" @click="$emit('diagnose', item)">
                            <el-icon>
                                <MagicStick />
                            </el-icon>
                            AI 诊断
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { MagicStick } from '@element-plus/icons-vue';
import type { ActivityLogItem } from '@/types/dashboard';

defineProps<{ activities: ActivityLogItem[] }>();
defineEmits<{ (e: 'diagnose', item: ActivityLogItem): void }>();
</script>

<style scoped>
.activity-card {
    background: #ffffff;
    border: 1px solid #f1f5f9;
    border-radius: 1rem;
    padding: 1.5rem;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
    height: 100%;
    display: flex;
    flex-direction: column;
}

.activity-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

.activity-title {
    font-size: 1rem;
    font-weight: 700;
    color: #1e293b;
}

.live-tag {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 99px;
    font-size: 0.7rem;
    font-weight: 700;
    color: #64748b;
}

.live-dot {
    width: 6px;
    height: 6px;
    background: #ef4444;
    border-radius: 50%;
    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
}

.activity-list {
    flex: 1;
    overflow-y: auto;
    padding-right: 0.5rem;
}

.activity-item {
    position: relative;
    display: flex;
    gap: 1rem;
    padding-bottom: 1.5rem;
}

.timeline-line {
    position: absolute;
    left: 5px;
    top: 1.25rem;
    bottom: 0;
    width: 2px;
    background: #f1f5f9;
}

.timeline-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #cbd5e1;
    margin-top: 4px;
    flex-shrink: 0;
    z-index: 1;
    border: 2px solid #fff;
}

.timeline-dot.is-info {
    background: #3b82f6;
}

.timeline-dot.is-success {
    background: #10b981;
}

.timeline-dot.is-warning {
    background: #f59e0b;
}

.timeline-dot.is-danger {
    background: #ef4444;
}

.activity-text {
    font-size: 0.875rem;
    color: #1e293b;
    margin-bottom: 0.25rem;
}

.activity-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.activity-time {
    font-size: 0.75rem;
    color: #94a3b8;
}

.diagnose-link {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #3b82f6;
    font-size: 0.75rem;
    font-weight: 600;
    border: none;
    background: none;
    cursor: pointer;
    padding: 0;
    transition: opacity 0.2s;
}

.diagnose-link:hover {
    opacity: 0.8;
}

/* 滚动条美化 */
.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 2px;
}
</style>