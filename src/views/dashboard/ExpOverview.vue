<template>
    <div class="dashboard-page-root">
        <div class="page-inner-container">

            <header class="page-header">
                <div class="header-left">
                    <h1 class="main-title">
                        Dashboard <span class="title-accent">Pro</span>
                    </h1>
                    <div class="system-status">
                        <span class="status-pulse"></span>
                        系统全域运行平稳 · {{ currentDate }}
                    </div>
                </div>
                <div class="header-right">
                    <button class="icon-btn"><el-icon>
                            <Bell />
                        </el-icon></button>
                    <el-avatar :size="40" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
                </div>
            </header>

            <section class="ai-section">
                <ExpAiCommandBar />
            </section>

            <div v-if="dashboardData" class="content-body">
                <div class="stats-grid">
                    <ExpStatCard title="设备总数" :value="dashboardData.overview.totalDevices" icon="Monitor" :trend="12" />
                    <ExpStatCard title="在线率" :value="dashboardData.overview.onlineRate" unit="%" icon="Connection"
                        status="normal" sub-text="网络健康" />
                    <ExpStatCard title="当前告警" :value="dashboardData.overview.activeAlerts" icon="WarningFilled"
                        status="danger" :is-danger="true" sub-text="需立即处理" />
                    <ExpStatCard title="进行中任务" :value="dashboardData.overview.ongoingTasks" icon="Cpu"
                        sub-text="固件升级中" />
                </div>
                <section class="mb-8">
                    <ExpProductMatrix :products="dashboardData.products" :active-id="currentProductId"
                        @select="handleProductClick" />
                </section>
                <div class="main-grid">
                    <div class="chart-container-box">
                        <ExpChartContainer title="全网流量趋势" :options="chartOptions" :loading="loading">
                            <template #action>
                                <el-radio-group v-model="timeRange" size="small" class="custom-radio">
                                    <el-radio-button label="24H" value="24H">24H</el-radio-button>
                                    <el-radio-button label="7D" value="7D">7天</el-radio-button>
                                </el-radio-group>
                            </template>
                        </ExpChartContainer>
                    </div>

                    <div class="activity-container-box">
                        <ExpActivityList :activities="dashboardData.activities" @diagnose="openDiagnosis" />
                    </div>

                </div>
            </div>
        </div>

        <ExpAiDiagnosisModal v-model="showDiagnosis" :log-content="currentLogContent" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import dayjs from 'dayjs';
import { useExpDashboard } from '@/composables/useExpDashboard';
import ExpAiCommandBar from './components/ExpAiCommandBar.vue';
import ExpStatCard from './components/ExpStatCard.vue';
import ExpActivityList from './components/ExpActivityList.vue';
import ExpChartContainer from './components/ExpChartContainer.vue';
import ExpAiDiagnosisModal from './components/ExpAiDiagnosisModal.vue';
import ExpProductMatrix from './components/ExpProductMatrix.vue';
import { Bell } from '@element-plus/icons-vue';

const currentDate = dayjs().format('YYYY年MM月DD日');
// const timeRange = ref('24H');
const showDiagnosis = ref(false);
const currentLogContent = ref('');
const {
    dashboardData,
    loading,
    timeRange,          // 直接从这里获取状态
    currentProductId,   // 获取当前选中的产品ID
    toggleProduct       // 获取操作方法
} = useExpDashboard();


const chartOptions = computed(() => {
    if (!dashboardData.value) return null;
    const trend = dashboardData.value.trafficTrend;
    return {
        tooltip: { trigger: 'axis', backgroundColor: '#fff', textStyle: { color: '#475569' } },
        grid: { top: 20, right: 10, bottom: 20, left: 40, containLabel: true },
        xAxis: { type: 'category', data: trend.categories, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#94a3b8' } },
        yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } }, axisLabel: { color: '#94a3b8' } },
        series: [{
            data: trend.series,
            type: 'line',
            smooth: true,
            showSymbol: false,
            itemStyle: { color: '#3b82f6' },
            areaStyle: {
                color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(59, 130, 246, 0.2)' }, { offset: 1, color: 'rgba(59, 130, 246, 0.01)' }] }
            },
            xAxis: { type: 'category', data: trend.categories /* ... */ },
            series: [{
                data: trend.series,
                // ...
            }]
        }]
    };
});

const openDiagnosis = (item: any) => {
    currentLogContent.value = `日志: ${item.content}`;
    showDiagnosis.value = true;
};

const handleProductClick = (product: any) => {
    toggleProduct(product.id);
};
</script>

<style scoped>
.dashboard-page-root {
    min-height: 100vh;
    background-color: #f8fafc;
    /* 灰底背景 */
    padding: 2rem;
    font-family: 'Inter', -apple-system, sans-serif;
}

.page-inner-container {
    max-width: 1440px;
    margin: 0 auto;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2.5rem;
}

.main-title {
    font-size: 1.875rem;
    font-weight: 800;
    color: #1e293b;
    letter-spacing: -0.05em;
    margin-bottom: 0.25rem;
}

.title-accent {
    background: linear-gradient(135deg, #3b82f6 0%, #22d3ee 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.system-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #64748b;
}

.status-pulse {
    width: 8px;
    height: 8px;
    background: #10b981;
    border-radius: 50%;
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

.header-right {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.icon-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 1px solid #e2e8f0;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s;
}

.icon-btn:hover {
    background: #f1f5f9;
    color: #3b82f6;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.main-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 1.5rem;
}

.chart-container-box,
.activity-container-box {
    min-height: 450px;
}

@media (max-width: 1200px) {
    .stats-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    .main-grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 640px) {
    .stats-grid {
        grid-template-columns: 1fr;
    }
}
</style>