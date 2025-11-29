// src/composables/useDashboard.ts
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
// ✅ 替换引用
import { fetchDashboardData } from '@/api'

export interface DashboardData {
    // ... (保持原有的类型定义不变)
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

    const fetchDashboardDataAction = async () => {
        loading.value = true
        try {
            // ✅ 使用 API 模块调用
            const data = await fetchDashboardData()

            // 直接赋值，API 层已经处理了解包逻辑
            if (data) {
                dashboardData.value = data
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error)
            ElMessage.error('加载仪表盘数据失败')
        } finally {
            loading.value = false
        }
    }

    return {
        loading,
        dashboardData,
        fetchDashboardData: fetchDashboardDataAction
    }
}