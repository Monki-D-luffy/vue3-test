<template>
    <div class="stat-card-wrapper hover-lift">
        <div class="stat-header">
            <span class="stat-title">{{ title }}</span>
            <div class="stat-icon-box" :class="[status === 'danger' ? 'is-danger' : 'is-primary']">
                <el-icon>
                    <component :is="icon" />
                </el-icon>
            </div>
        </div>

        <div class="stat-body">
            <div class="stat-value-group">
                <span class="stat-value">{{ value }}</span>
                <span v-if="unit" class="stat-unit">{{ unit }}</span>
            </div>
        </div>

        <div class="stat-footer">
            <template v-if="trend !== undefined">
                <div class="trend-indicator" :class="trend >= 0 ? 'up' : 'down'">
                    <el-icon>
                        <component :is="trend >= 0 ? Top : Bottom" />
                    </el-icon>
                    <span>{{ Math.abs(trend) }}%</span>
                </div>
                <span class="stat-hint">较昨日</span>
            </template>
            <template v-else-if="subText">
                <span class="stat-subtext" :class="{ 'is-danger': isDanger }">{{ subText }}</span>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Top, Bottom } from '@element-plus/icons-vue';

defineProps<{
    title: string;
    value: number | string;
    icon: string;
    unit?: string;
    trend?: number;
    subText?: string;
    status?: 'normal' | 'danger';
    isDanger?: boolean;
}>();
</script>

<style scoped>
.stat-card-wrapper {
    background: #ffffff;
    border: 1px solid #f1f5f9;
    border-radius: 1rem;
    padding: 1.5rem;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 160px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.hover-lift:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    border-color: #dbeafe;
}

.stat-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
}

.stat-title {
    color: #64748b;
    font-size: 0.875rem;
    font-weight: 500;
}

.stat-icon-box {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
}

.stat-icon-box.is-primary {
    background: #eff6ff;
    color: #3b82f6;
}

.stat-icon-box.is-danger {
    background: #fef2f2;
    color: #ef4444;
}

.stat-value {
    font-size: 1.875rem;
    font-weight: 700;
    color: #1e293b;
    letter-spacing: -0.025em;
}

.stat-unit {
    font-size: 0.875rem;
    color: #64748b;
    margin-left: 0.25rem;
}

.stat-footer {
    margin-top: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
}

.trend-indicator {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 600;
}

.trend-indicator.up {
    background: #ecfdf5;
    color: #10b981;
}

.trend-indicator.down {
    background: #fef2f2;
    color: #ef4444;
}

.stat-subtext {
    color: #64748b;
}

.stat-subtext.is-danger {
    color: #ef4444;
    font-weight: 500;
}

.stat-hint {
    color: #94a3b8;
}
</style>