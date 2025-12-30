<template>
    <div class="stats-container">
        <el-row :gutter="20">
            <el-col :xs="12" :sm="6" v-for="(metric, index) in metrics" :key="index">
                <div class="stat-card">
                    <div class="stat-content">
                        <span class="stat-label">{{ metric.label }}</span>
                        <div class="stat-number-box">
                            <span class="stat-value">{{ formatNumber(metric.value) }}</span>
                            <span v-if="metric.unit" class="stat-unit">{{ metric.unit }}</span>
                        </div>
                    </div>

                    <el-icon class="bg-icon" :class="metric.colorClass">
                        <component :is="metric.icon" />
                    </el-icon>

                    <div v-if="metric.percent" class="progress-track">
                        <div class="progress-bar" :class="metric.bgClass || 'bg-primary'"
                            :style="{ width: metric.percent + '%' }"></div>
                    </div>
                </div>
            </el-col>
        </el-row>
    </div>
</template>

<script setup lang="ts">
import { markRaw, reactive } from 'vue';
import { Files, DataLine, Connection, Bell } from '@element-plus/icons-vue';

// 使用 reactive 定义数据，图标使用 markRaw
const metrics = reactive([
    {
        label: 'Total Products',
        value: 12,
        unit: '个',
        icon: markRaw(Files),
        colorClass: 'text-primary',
        percent: 0
    },
    {
        label: 'Development',
        value: 8,
        unit: '项',
        icon: markRaw(DataLine),
        colorClass: 'text-warning',
        bgClass: 'bg-warning',
        percent: 65
    },
    {
        label: 'Active Devices',
        value: 12450,
        unit: '在线',
        icon: markRaw(Connection),
        colorClass: 'text-success',
        bgClass: 'bg-success',
        percent: 0
    },
    {
        label: 'Alerts',
        value: 2,
        unit: '告警',
        icon: markRaw(Bell),
        colorClass: 'text-danger',
        bgClass: 'bg-danger',
        percent: 0
    },
]);

const formatNumber = (num: number) => {
    return num >= 10000 ? (num / 10000).toFixed(1) + 'w' : num;
};
</script>

<style scoped>
.stats-container {
    margin-bottom: 24px;
}

.stat-card {
    position: relative;
    background-color: var(--bg-card);
    border: 1px solid var(--border-base);
    border-radius: 12px;
    padding: 20px;
    height: 110px;
    overflow: hidden;
    transition: all 0.3s ease;
    box-shadow: var(--shadow-card);
}

.stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.stat-content {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
}

.stat-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.stat-number-box {
    display: flex;
    align-items: baseline;
    gap: 4px;
}

.stat-value {
    font-size: 32px;
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1;
}

.stat-unit {
    font-size: 12px;
    color: var(--text-secondary);
}

.bg-icon {
    position: absolute;
    right: -10px;
    bottom: -15px;
    font-size: 64px;
    opacity: 0.1;
    transform: rotate(12deg);
    z-index: 1;
    transition: opacity 0.3s;
}

.stat-card:hover .bg-icon {
    opacity: 0.15;
}

/* 颜色辅助类 */
.text-primary {
    color: var(--el-color-primary);
}

.text-warning {
    color: var(--el-color-warning);
}

.text-success {
    color: var(--el-color-success);
}

.text-danger {
    color: var(--el-color-danger);
}

/* 进度条 */
.progress-track {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background-color: rgba(0, 0, 0, 0.05);
}

.progress-bar {
    height: 100%;
    transition: width 1s ease;
}

.bg-primary {
    background-color: var(--el-color-primary);
}

.bg-warning {
    background-color: var(--el-color-warning);
}

.bg-success {
    background-color: var(--el-color-success);
}

.bg-danger {
    background-color: var(--el-color-danger);
}
</style>