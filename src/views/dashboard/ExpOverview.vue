<template>
    <div class="dashboard-container">
        <header class="flex-between mb-8">
            <div>
                <h1 class="text-2xl font-bold text-primary mb-1">
                    Dashboard <span class="text-gradient-ai">Pro</span>
                </h1>
                <p class="text-sm text-secondary flex-center gap-2">
                    <span class="pulse-dot text-success"></span>
                    系统全域运行平稳 · {{ currentDate }}
                </p>
            </div>
            <div class="flex-center gap-4">
                <el-button circle plain icon="Bell" />
                <el-avatar :size="40" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
            </div>
        </header>

        <section class="mb-8">
            <ExpAiCommandBar />
        </section>

        <div v-if="loading && !dashboardData" class="py-20 flex-center">
            <el-skeleton animated :rows="5" class="w-full" />
        </div>

        <div v-else-if="dashboardData">
            <section class="grid-stats mb-8">
                <ExpStatCard title="设备总数" :value="dashboardData.overview.totalDevices" icon="Monitor" trend="12" />
                <ExpStatCard title="在线率" :value="dashboardData.overview.onlineRate" unit="%" icon="Connection"
                    status="normal" sub-text="网络健康" />
                <ExpStatCard title="当前告警" :value="dashboardData.overview.activeAlerts" icon="WarningFilled"
                    status="danger" :is-danger="true" sub-text="需立即处理" />
                <ExpStatCard title="进行中任务" :value="dashboardData.overview.ongoingTasks" icon="Cpu" sub-text="固件升级中" />
            </section>

            <section class="grid-main h-[400px]">
                <div class="min-h-0">
                    <ExpChartContainer title="全网流量趋势" :options="chartOptions" :loading="loading">
                        <template #action>
                            <el-radio-group v-model="timeRange" size="small">
                                <el-radio-button label="24H" />
                                <el-radio-button label="7D" />
                            </el-radio-group>
                        </template>
                    </ExpChartContainer>
                </div>

                <div class="min-h-0">
                    <ExpActivityList :activities="dashboardData.activities" @diagnose="openDiagnosis" />
                </div>
            </section>
        </div>
    </div>

    <ExpAiDiagnosisModal v-model="showDiagnosis" :log-content="currentLogContent" @fix="handleCreateTicket" />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import dayjs from 'dayjs';
import { ElMessage } from 'element-plus';

// Composables
import { useExpDashboard } from '@/composables/useExpDashboard';

// Components
import ExpAiCommandBar from './components/ExpAiCommandBar.vue';
import ExpStatCard from './components/ExpStatCard.vue';
import ExpActivityList from './components/ExpActivityList.vue';
import ExpChartContainer from './components/ExpChartContainer.vue';
import ExpAiDiagnosisModal from './components/ExpAiDiagnosisModal.vue';
import type { ActivityLogItem } from '@/types/dashboard';

// Init
const currentDate = dayjs().format('YYYY-MM-DD');
const timeRange = ref('24H');
const showDiagnosis = ref(false);
const currentLogContent = ref('');

// Data Fetching
const { dashboardData, loading } = useExpDashboard();

// Chart Options Computation (适配 ECharts)
const chartOptions = computed(() => {
    if (!dashboardData.value) return null;
    const trend = dashboardData.value.trafficTrend;

    return {
        tooltip: { trigger: 'axis' },
        grid: { top: 10, right: 10, bottom: 20, left: 40, containLabel: true },
        xAxis: {
            type: 'category',
            data: trend.categories,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#94a3b8' }
        },
        yAxis: {
            type: 'value',
            splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } }
        },
        series: [{
            data: trend.series,
            type: 'line',
            smooth: true,
            showSymbol: false,
            itemStyle: { color: '#3b82f6' },
            areaStyle: {
                color: {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                        { offset: 0, color: 'rgba(59, 130, 246, 0.2)' },
                        { offset: 1, color: 'rgba(59, 130, 246, 0.01)' }
                    ]
                }
            }
        }]
    };
});

// Event Handlers
const openDiagnosis = (item: ActivityLogItem) => {
    currentLogContent.value = `日志时间: ${item.time}\n日志内容: ${item.content}\n请分析可能的技术原因。`;
    showDiagnosis.value = true;
};

const handleCreateTicket = () => {
    ElMessage.success('已自动创建维修工单 #WORK-8823');
};
</script>

<style scoped>
.dashboard-container {
    padding: 24px;
    max-width: 1600px;
    margin: 0 auto;
}

.text-primary {
    color: var(--text-primary);
}

.text-secondary {
    color: var(--text-secondary);
}

.text-success {
    color: var(--color-success);
}

/* Grid Layout System */
.grid-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
}

.grid-main {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 24px;
}

/* Responsive Handling */
@media (max-width: 1200px) {
    .grid-stats {
        grid-template-columns: repeat(2, 1fr);
    }

    .grid-main {
        grid-template-columns: 1fr;
        height: auto;
    }
}

@media (max-width: 768px) {
    .grid-stats {
        grid-template-columns: 1fr;
    }
}
</style>