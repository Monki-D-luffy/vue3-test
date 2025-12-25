<template>
    <div class="chart-wrapper dashboard-card flex-col">
        <div class="flex-between mb-4">
            <h3 class="font-bold text-primary">{{ title }}</h3>
            <slot name="action"></slot>
        </div>

        <div ref="chartRef" class="flex-1 w-full min-h-[300px]"></div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import * as echarts from 'echarts';

const props = defineProps<{
    title: string;
    options: any; // ECharts Option
    loading?: boolean;
}>();

const chartRef = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;

// 初始化图表
const initChart = () => {
    if (!chartRef.value) return;

    chartInstance = echarts.init(chartRef.value);
    if (props.options) {
        chartInstance.setOption(props.options);
    }
};

// 监听数据变化
watch(() => props.options, (newVal) => {
    chartInstance?.setOption(newVal);
}, { deep: true });

// 监听 Loading
watch(() => props.loading, (val) => {
    val ? chartInstance?.showLoading() : chartInstance?.hideLoading();
});

// 响应式处理
const handleResize = () => {
    chartInstance?.resize();
};

onMounted(() => {
    initChart();

    // 使用 ResizeObserver 替代 window.resize，支持局部布局变化
    if (chartRef.value) {
        resizeObserver = new ResizeObserver(() => {
            // 加防抖或 requestAnimationFrame 优化性能
            window.requestAnimationFrame(() => handleResize());
        });
        resizeObserver.observe(chartRef.value.parentElement || document.body);
    }
});

onUnmounted(() => {
    chartInstance?.dispose();
    resizeObserver?.disconnect();
});
</script>

<style scoped>
.chart-wrapper {
    width: 100%;
    height: 100%;
}

.text-primary {
    color: var(--text-primary);
}
</style>