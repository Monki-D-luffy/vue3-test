<template>
    <div class="dashboard-container">
        <div class="dashboard-header">
            <div class="header-left">
                <h1 class="welcome-text">早安，Admin 👋</h1>
                <p class="sub-text">今日系统运行平稳，共有 {{ dashboardData.onlineCount }} 台设备在线。</p>
            </div>
            <div class="header-right">
                <el-button type="primary" icon="Plus" circle class="action-btn" />
                <el-button icon="Bell" circle class="action-btn" />
                <el-button icon="Refresh" circle class="action-btn" :loading="loading" @click="fetchDashboardData" />
            </div>
        </div>

        <el-row :gutter="20" class="mb-6">
            <el-col :xs="24" :sm="12" :md="6" v-for="(item, index) in statItems" :key="index">
                <el-skeleton :loading="loading" animated>
                    <template #template>
                        <div class="card-base" style="height: 160px; padding: 20px;">
                            <el-skeleton-item variant="p" style="width: 50%" />
                            <el-skeleton-item variant="h1" style="width: 80%; margin-top: 10px;" />
                        </div>
                    </template>
                    <template #default>
                        <StatCard :label="item.label" :value="item.value" :unit="item.unit" :icon-component="item.icon"
                            :color-theme="item.color" :trend="item.trend" />
                    </template>
                </el-skeleton>
            </el-col>
        </el-row>

        <el-row :gutter="20">
            <el-col :xs="24" :lg="16">
                <div class="card-base chart-card hover-lift">
                    <div class="card-header-row">
                        <h3 class="card-title">设备在线趋势</h3>
                        <el-radio-group v-model="chartRange" size="small">
                            <el-radio-button value="7days">近7天</el-radio-button>
                            <el-radio-button value="30days">近30天</el-radio-button>
                        </el-radio-group>
                    </div>
                    <div class="chart-container" ref="chartRef"></div>
                </div>
            </el-col>

            <el-col :xs="24" :lg="8">
                <div class="card-base activity-card hover-lift">
                    <div class="card-header-row">
                        <h3 class="card-title">实时动态</h3>
                        <el-link type="primary" :underline="false">查看全部</el-link>
                    </div>

                    <el-scrollbar height="320px">
                        <ul class="activity-list">
                            <li v-for="act in dashboardData.recentActivities" :key="act.id" class="activity-item">
                                <div class="act-icon" :class="`bg-${act.type}`">
                                    <div class="dot"></div>
                                </div>
                                <div class="act-content">
                                    <p class="act-msg">{{ act.content }} <span class="act-device">{{ act.device
                                    }}</span></p>
                                    <span class="act-time">{{ act.time }}</span>
                                </div>
                            </li>
                        </ul>
                    </el-scrollbar>
                </div>
            </el-col>
        </el-row>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { Monitor, Connection, Warning, Upload, Plus, Bell, Refresh, Top, Bottom } from '@element-plus/icons-vue'
import StatCard from '@/components/StatCard.vue'
import { useDashboard } from '@/composables/useDashboard'

const { loading, dashboardData, fetchDashboardData } = useDashboard()
const chartRef = ref<HTMLElement | null>(null)
const chartRange = ref('7days')
let myChart: echarts.ECharts | null = null

// 计算属性适配 StatCard 格式
const statItems = computed(() => [
    { label: '设备总数', value: dashboardData.value.totalDevices, unit: '台', icon: Monitor, color: 'blue', trend: dashboardData.value.totalTrend },
    { label: '在线设备', value: dashboardData.value.onlineCount, unit: '台', icon: Connection, color: 'green', trend: dashboardData.value.onlineTrend },
    { label: '当前告警', value: dashboardData.value.warningCount, unit: '条', icon: Warning, color: 'red', trend: dashboardData.value.warningTrend },
    { label: '待升级', value: dashboardData.value.pendingUpgrades, unit: '个', icon: Upload, color: 'purple', trend: dashboardData.value.upgradeTrend },
])

// ECharts 初始化
const initChart = () => {
    if (!chartRef.value) return

    myChart = echarts.init(chartRef.value)

    const option = {
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: dashboardData.value.chartData.dates,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#94a3b8' }
        },
        yAxis: {
            type: 'value',
            splitLine: { lineStyle: { type: 'dashed', color: '#334155' } }
        },
        series: [
            {
                name: '在线设备',
                type: 'line',
                smooth: true,
                symbol: 'none',
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(79, 70, 229, 0.3)' },
                        { offset: 1, color: 'rgba(79, 70, 229, 0)' }
                    ])
                },
                lineStyle: { width: 3, color: '#4f46e5' },
                data: dashboardData.value.chartData.online
            }
        ]
    }

    myChart.setOption(option)
}

// 监听窗口大小变化
window.addEventListener('resize', () => {
    myChart?.resize()
})

onMounted(async () => {
    await fetchDashboardData()
    // 等待 DOM 更新后初始化图表
    nextTick(() => {
        initChart()
    })
})

// 数据变化时刷新图表
watch(() => dashboardData.value.chartData, () => {
    if (myChart) {
        myChart.setOption({
            xAxis: { data: dashboardData.value.chartData.dates },
            series: [{ data: dashboardData.value.chartData.online }]
        })
    }
}, { deep: true })

</script>

<style scoped>
.dashboard-container {
    padding: 0;
}

/* Header */
.dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

.welcome-text {
    font-size: 24px;
    font-weight: 700;
    /* ✅ 修复变量 */
    color: var(--app-text-main);
    margin-bottom: 4px;
}

.sub-text {
    /* ✅ 修复变量 */
    color: var(--app-text-sub);
    font-size: 14px;
}

.action-btn {
    margin-left: 12px;
    /* ✅ 修复变量 */
    border: 1px solid var(--app-border-color);
}

.mb-6 {
    margin-bottom: 24px;
}

/* Chart Card */
.chart-card {
    padding: 24px;
    height: 420px;
    display: flex;
    flex-direction: column;
    /* .card-base 已经处理了背景色，这里不需要写 */
}

.card-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.card-title {
    font-size: 18px;
    font-weight: 600;
    /* ✅ 修复变量 */
    color: var(--app-text-main);
    margin: 0;
}

.chart-container {
    flex: 1;
    width: 100%;
}

/* Activity Card */
.activity-card {
    padding: 24px;
    height: 420px;
}

.activity-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.activity-item {
    display: flex;
    align-items: flex-start;
    padding: 16px 0;
    /* ✅ 修复变量 */
    border-bottom: 1px solid var(--app-border-color);
}

.activity-item:last-child {
    border-bottom: none;
}

/* Dots 样式不变 */
.act-icon {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    margin-top: 6px;
    margin-right: 12px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* ... bg-info 等颜色保持 ... */
.bg-info {
    background-color: var(--el-color-info);
}

.bg-success {
    background-color: var(--el-color-success);
}

.bg-warning {
    background-color: var(--el-color-warning);
}

.bg-danger {
    background-color: var(--el-color-danger);
}

.act-content {
    flex: 1;
}

.act-msg {
    font-size: 14px;
    /* ✅ 修复变量 */
    color: var(--app-text-main);
    margin-bottom: 4px;
    line-height: 1.4;
}

.act-device {
    color: var(--el-color-primary);
    font-weight: 500;
}

.act-time {
    font-size: 12px;
    /* ✅ 修复变量 */
    color: var(--app-text-sub);
}
</style>