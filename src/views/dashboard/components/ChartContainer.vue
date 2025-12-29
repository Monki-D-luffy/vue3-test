<template>
    <div class="chart-card">
        <div class="chart-header">
            <h3 class="chart-title">{{ title }}</h3>
            <div class="chart-actions">
                <slot name="action"></slot>
            </div>
        </div>
        <div ref="chartRef" class="chart-canvas"></div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as echarts from 'echarts';

const handleThemeChange = (e: any) => {
    const theme = e.detail; // 'dark' | 'light'

    // 更新图表配置以适应暗黑模式
    const darkOption = {
        xAxis: { axisLabel: { color: theme === 'dark' ? '#94a3b8' : '#64748b' } },
        yAxis: { splitLine: { lineStyle: { color: theme === 'dark' ? '#334155' : '#f1f5f9' } } },
        // ... 其他需要同步的色值
    };

    chartInstance?.setOption(darkOption);
};

const props = defineProps<{
    title: string;
    options: any;
    loading?: boolean;
}>();

const chartRef = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;

const initChart = () => {
    if (!chartRef.value || chartRef.value.clientWidth === 0) return;
    if (!chartInstance) {
        chartInstance = echarts.init(chartRef.value);
    }
    if (props.options) {
        chartInstance.setOption(props.options);
    }
};

watch(() => props.options, (val) => chartInstance?.setOption(val), { deep: true });
watch(() => props.loading, (val) => val ? chartInstance?.showLoading() : chartInstance?.hideLoading());

onMounted(() => {
    initChart();
    resizeObserver = new ResizeObserver(() => {
        window.requestAnimationFrame(() => chartInstance?.resize());
    });
    if (chartRef.value) resizeObserver.observe(chartRef.value);

    window.addEventListener('theme-change', handleThemeChange);
});

onUnmounted(() => {
    chartInstance?.dispose();
    resizeObserver?.disconnect();
    window.removeEventListener('theme-change', handleThemeChange);
});
</script>

<style scoped>
.chart-card {
    background: #ffffff;
    border: 1px solid #f1f5f9;
    border-radius: 1rem;
    padding: 1.5rem;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
    height: 100%;
    display: flex;
    flex-direction: column;
}

.chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

.chart-title {
    font-size: 1rem;
    font-weight: 700;
    color: #1e293b;
}

.chart-canvas {
    flex: 1;
    width: 100%;
    min-height: 300px;
}
</style>