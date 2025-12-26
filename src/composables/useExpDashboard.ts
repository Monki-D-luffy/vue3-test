import { ref, watch, onMounted, onUnmounted } from 'vue';
import request from '@/utils/request';
import type { DashboardData } from '@/types/dashboard';

export function useExpDashboard() {
    // ================= State (状态) =================
    const loading = ref(false);
    const dashboardData = ref<DashboardData | null>(null);
    const error = ref<string | null>(null);

    // 核心筛选状态 (驱动数据的源头)
    const timeRange = ref<'24H' | '7D'>('24H');
    const currentProductId = ref<string>(''); // 选中的产品ID，为空则代表“全部”

    let pollTimer: number | null = null;

    // ================= Actions (动作) =================

    /**
     * 获取数据
     * @param silent 是否静默加载 (不显示全屏 loading)
     */
    const fetchData = async (silent = false) => {
        if (!silent) loading.value = true;

        try {
            // 构造查询参数
            const params = {
                range: timeRange.value,
                productId: currentProductId.value || undefined
            };

            // 发送请求，带上参数
            const data = await request.get<DashboardData>('/dashboard/stats', { params });

            dashboardData.value = data;
            error.value = null;
        } catch (e: any) {
            error.value = e.message || '数据加载失败';
            console.error('Dashboard Fetch Error:', e);

            // 如果是静默轮询失败，通常不需要打扰用户，但在开发环境打印
        } finally {
            if (!silent) loading.value = false;
        }
    };

    /**
     * 切换时间范围
     */
    const setTimeRange = (range: '24H' | '7D') => {
        timeRange.value = range;
        // 注意：这里不需要手动调用 fetchData，因为下方有 watch 监听
    };

    /**
     * 选中/取消选中特定产品
     */
    const toggleProduct = (id: string) => {
        if (currentProductId.value === id) {
            currentProductId.value = ''; // 再次点击取消选中
        } else {
            currentProductId.value = id;
        }
    };

    // ================= Watchers (监听器) =================

    // 监听筛选条件变化，自动重载数据
    // 这是一个非常关键的模式：数据驱动视图，状态驱动数据
    watch([timeRange, currentProductId], () => {
        // 当筛选条件变化时，通常需要显式的 loading 状态让用户感知
        fetchData(false);

        // 筛选变化时，建议重置轮询计时器，避免刚请求完又轮询
        restartPolling();
    });

    // ================= Lifecycle & Polling =================

    const startPolling = (interval = 30000) => {
        stopPolling(); // 防止重复启动
        // 初始加载由 onMounted 触发，或者在此处立即执行一次（视需求而定）
        // 这里我们选择不立即执行，因为 onMounted 会调 fetchData

        pollTimer = window.setInterval(() => {
            fetchData(true); // 轮询使用静默模式
        }, interval);
    };

    const stopPolling = () => {
        if (pollTimer) {
            clearInterval(pollTimer);
            pollTimer = null;
        }
    };

    // 辅助函数：重置轮询
    const restartPolling = () => {
        stopPolling();
        startPolling();
    };

    onMounted(() => {
        fetchData(); // 首次加载
        startPolling();
    });

    onUnmounted(() => {
        stopPolling();
    });

    return {
        // State
        loading,
        error,
        dashboardData,
        timeRange,
        currentProductId,

        // Actions
        refresh: () => fetchData(false),
        setTimeRange,
        toggleProduct
    };
}