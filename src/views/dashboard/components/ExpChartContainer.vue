<template>
    <div class="chart-wrapper dashboard-card flex-col">
        <div class="flex-between mb-4">
            <h3 class="font-bold text-primary">{{ title }}</h3>
            <slot name="action"></slot>
        </div>

        <div ref="chartRef" class="flex-1 w-full" style="min-height: 200px;"></div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
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

    // 🔥🔥 核心修复：防御性检查
    // 如果容器宽度或高度为 0，直接跳过，等待 ResizeObserver 再次召唤
    const width = chartRef.value.clientWidth;
    const height = chartRef.value.clientHeight;

    if (width === 0 || height === 0) {
        // console.warn('Chart container has no size, delaying init...');
        return;
    }

    // 防止重复初始化
    if (chartInstance) return;

    chartInstance = echarts.init(chartRef.value);
    if (props.options) {
        chartInstance.setOption(props.options);
    }
};

// 监听数据变化
watch(() => props.options, (newVal) => {
    if (chartInstance) {
        chartInstance.setOption(newVal);
    } else {
        // 如果之前因为没宽高没初始化成功，数据来了再试一次
        initChart();
    }
}, { deep: true });

// 监听 Loading
watch(() => props.loading, (val) => {
    val ? chartInstance?.showLoading() : chartInstance?.hideLoading();
});

// 响应式处理
const handleResize = () => {
    // 如果实例存在，调整大小
    if (chartInstance) {
        chartInstance.resize();
    } else {
        // 如果实例不存在（之前初始化失败），尝试重新初始化
        initChart();
    }
};

onMounted(() => {
    // 1. 尝试直接初始化 (可能失败)
    initChart();

    // 2. 启动尺寸监听 (这是双保险)
    if (chartRef.value) {
        resizeObserver = new ResizeObserver(() => {
            // 使用 requestAnimationFrame 避免 "ResizeObserver loop limit exceeded" 警告
            window.requestAnimationFrame(() => handleResize());
        });
        resizeObserver.observe(chartRef.value);
    }
});

onUnmounted(() => {
    chartInstance?.dispose();
    chartInstance = null;
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