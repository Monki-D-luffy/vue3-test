// src/composables/useDashboard.ts
import { ref } from 'vue'
import api from '@/api'
import { ElMessage } from 'element-plus'

export interface DashboardData {
    totalDevices: number;
    totalTrend: number;
    onlineCount: number;
    onlineTrend: number;
    warningCount: number;
    warningTrend: number;
    pendingUpgrades: number;
    upgradeTrend: number;
    chartData: {
        dates: string[];
        online: number[];
        total: number[];
    };
    recentActivities: Array<{
        id: number;
        time: string;
        content: string;
        device: string;
        type: 'info' | 'success' | 'warning' | 'danger';
    }>;
}

export function useDashboard() {
    const loading = ref(false)
    const dashboardData = ref<DashboardData>({
        totalDevices: 0,
        totalTrend: 0,
        onlineCount: 0,
        onlineTrend: 0,
        warningCount: 0,
        warningTrend: 0,
        pendingUpgrades: 0,
        upgradeTrend: 0,
        chartData: { dates: [], online: [], total: [] },
        recentActivities: []
    })

    const fetchDashboardData = async () => {
        loading.value = true
        try {
            const res = await api.get('/dashboard/stats')
            if (res.data.success) {
                dashboardData.value = res.data.data
            }
        } catch (e) {
            console.error(e)
            ElMessage.error('加载仪表盘数据失败')
        } finally {
            loading.value = false
        }
    }

    return {
        loading,
        dashboardData,
        fetchDashboardData
    }
}