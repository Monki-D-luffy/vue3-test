<template>
    <div class="ios-dashboard-card">
        <div class="gauge-header">{{ config.name || '仪表盘' }}</div>

        <div class="gauge-body">
            <svg viewBox="0 0 100 50" class="gauge-svg">
                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#e2e8f0" stroke-width="8"
                    stroke-linecap="round" />
                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" :stroke="config.style.color || '#1a1a1a'"
                    stroke-width="8" stroke-linecap="round" class="progress-path"
                    :style="{ strokeDasharray: `${percentage * 1.25}, 125` }" />
            </svg>

            <div class="gauge-value">
                <span class="num">{{ Number(modelValue || 0).toFixed(0) }}</span>
                <span class="unit">{{ config.style.unit || '' }}</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useStudioStore } from '@/stores/studioStore';

const props = defineProps<{ config: any; modelValue?: number }>();
const store = useStudioStore();

// 计算百分比 (0~100)
const percentage = computed(() => {
    const val = Number(props.modelValue || 0);
    // 获取 DP 定义的范围
    let min = 0, max = 100;
    if (props.config.binding?.dpId) {
        const dp = store.dps.find(d => d.id === props.config.binding.dpId);
        if (dp?.property) {
            min = dp.property.min || 0;
            max = dp.property.max || 100;
        }
    }
    const pct = ((val - min) / (max - min)) * 100;
    return Math.max(0, Math.min(100, pct)); // Clamp 0-100
});
</script>

<style scoped>
.ios-dashboard-card {
    background: #fff;
    border-radius: 16px;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
    display: flex;
    flex-direction: column;
    align-items: center;
}

.gauge-header {
    font-size: 14px;
    color: #64748b;
    margin-bottom: 8px;
    align-self: flex-start;
}

.gauge-body {
    position: relative;
    width: 140px;
    height: 80px;
    display: flex;
    justify-content: center;
}

.gauge-svg {
    width: 100%;
    height: 100%;
    overflow: visible;
}

.progress-path {
    transition: stroke-dasharray 0.5s ease;
}

.gauge-value {
    position: absolute;
    bottom: 0;
    display: flex;
    align-items: baseline;
    gap: 2px;
}

.num {
    font-size: 28px;
    font-weight: 700;
    color: #1a1a1a;
    font-family: 'JetBrains Mono', monospace;
}

.unit {
    font-size: 12px;
    color: #94a3b8;
}
</style>