import { ref, onMounted, onUnmounted } from 'vue';
import request from '@/utils/request'; // 引入 request 对象
import type { DashboardData } from '@/types/dashboard';

export function useExpDashboard() {
    const loading = ref(false);
    const dashboardData = ref<DashboardData | null>(null);
    const error = ref<string | null>(null);

    let pollTimer: number | null = null;

    const fetchData = async () => {
        loading.value = true;
        try {
            // ✅ 修正点 1: 使用 request.get 方法，而不是直接调用 request
            // ✅ 修正点 2: 你的 request.ts 设置了 baseURL='/api'，这里只需写 '/dashboard/stats'
            // ✅ 修正点 3: 泛型 <DashboardData> 告诉 TS 返回值结构
            const data = await request.get<DashboardData>('/dashboard/stats');

            // ✅ 修正点 4: 你的 request.ts 拦截器已经解包了 res.data，
            // 所以这里直接赋值即可，不需要 res.data.data
            dashboardData.value = data;

            error.value = null;
        } catch (e: any) {
            error.value = e.message || '数据加载失败';
            console.error('Dashboard Fetch Error:', e);
        } finally {
            loading.value = false;
        }
    };

    /**
     * 启动自动轮询 (模拟实时监控)
     * @param interval 毫秒
     */
    const startPolling = (interval = 30000) => {
        fetchData(); // 立即执行一次
        pollTimer = window.setInterval(() => {
            // 轮询时通常不显示全屏 loading，静默更新
            request.get<DashboardData>('/dashboard/stats', { _silent: true } as any)
                .then(data => {
                    dashboardData.value = data;
                })
                .catch(e => console.error('Polling error:', e));
        }, interval);
    };

    const stopPolling = () => {
        if (pollTimer) {
            clearInterval(pollTimer);
            pollTimer = null;
        }
    };

    onMounted(() => {
        startPolling();
    });

    onUnmounted(() => {
        stopPolling();
    });

    return {
        loading,
        error,
        dashboardData,
        refresh: fetchData
    };
}