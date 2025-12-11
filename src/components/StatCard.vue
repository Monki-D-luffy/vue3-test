<template>
    <div class="stat-card card-base hover-lift">
        <div class="stat-content">
            <div class="stat-text">
                <span class="label">{{ label }}</span>
                <div class="value-group">
                    <span class="value">{{ value }}</span>
                    <span v-if="unit" class="unit">{{ unit }}</span>
                </div>
            </div>

            <div class="icon-wrapper" :class="colorTheme">
                <el-icon :size="24">
                    <component :is="iconComponent" />
                </el-icon>
            </div>
        </div>

        <div class="stat-footer" v-if="trend !== undefined">
            <span class="trend-badge" :class="trend >= 0 ? 'trend-up' : 'trend-down'">
                <el-icon>
                    <component :is="trend >= 0 ? 'Top' : 'Bottom'" />
                </el-icon>
                {{ Math.abs(trend) }}%
            </span>
            <span class="trend-desc">较昨日</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
    label: string
    value: string | number
    unit?: string
    iconComponent: Component
    colorTheme?: string
    trend?: number
}>()
</script>

<style scoped>
.stat-card {
    padding: 20px;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: var(--app-bg-card);
}

.stat-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
}

.stat-text {
    display: flex;
    flex-direction: column;
}

.label {
    font-size: 14px;
    color: var(--app-text-sub);
    margin-bottom: 8px;
}

.value-group {
    display: flex;
    align-items: baseline;
}

.value {
    font-size: 32px;
    font-weight: 700;
    color: var(--app-text-main);
    line-height: 1.2;
}

.unit {
    font-size: 14px;
    color: var(--app-text-sub);
    margin-left: 4px;
}

/* 图标主题系统 */
.icon-wrapper {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    transition: transform 0.3s ease;
}

.stat-card:hover .icon-wrapper {
    transform: scale(1.1) rotate(5deg);
}

.blue {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.green {
    background: linear-gradient(135deg, #10b981, #059669);
    box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
}

.orange {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3);
}

.purple {
    background: linear-gradient(135deg, #8b5cf6, #7c3aed);
    box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
}

.red {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
}

/* 趋势条样式 */
.stat-footer {
    display: flex;
    align-items: center;
    font-size: 13px;
    border-top: 1px solid var(--app-border-color);
    padding-top: 12px;
}

.trend-badge {
    display: flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 99px;
    font-weight: 600;
    margin-right: 8px;
}

.trend-up {
    background-color: #ecfdf5;
    color: #059669;
}

.trend-down {
    background-color: #fef2f2;
    color: #dc2626;
}

.trend-desc {
    color: var(--app-text-sub);
}
</style>