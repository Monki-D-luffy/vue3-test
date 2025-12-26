// src/composables/useAiContext.ts
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useExpDashboard } from '@/composables/useExpDashboard';
// 假设你还有这些 Store 或 Composable
import { useDeviceList } from '@/composables/useDeviceList';
// import { useDeviceDetail } from '@/composables/useDeviceDetail';

export function useAiContext() {
    const route = useRoute();
    const dashboardStore = useExpDashboard();
    const deviceListStore = useDeviceList(); // 假设你有这个

    // 策略模式：根据路由匹配不同的数据源
    const currentContext = computed(() => {
        const path = route.path;

        // 场景 1: Dashboard 首页
        if (path === '/dashboard' || path === '/') {
            return {
                scene: 'Dashboard',
                summary: '用户正在查看全局概览',
                data: dashboardStore.getAnalysisContext() // 复用之前的
            };
        }

        // 场景 2: 设备管理列表页
        if (path.includes('/device/list')) {
            // 只喂给 AI 当前页显示的这 10 条数据，不要给全部，防止 Token 爆炸
            const visibleDevices = deviceListStore.deviceList.value.map(d => ({
                id: d.id,
                name: d.name,
                status: d.status,
                firmware: d.firmwareVersion
            }));

            return {
                scene: 'DeviceManagement',
                summary: '用户正在浏览设备列表',
                data: {
                    totalCount: deviceListStore.total.value,
                    filters: deviceListStore.searchParams.value, // 让 AI 知道当前过滤条件
                    currentView: visibleDevices
                }
            };
        }

        // 场景 3: 这里的详情页 (假设 URL 是 /device/detail/:id)
        if (path.includes('/device/detail')) {
            return {
                scene: 'DeviceDetail',
                summary: `用户正在分析设备 ${route.params.id} 的详情`,
                // data: ... 获取详情和日志
            };
        }

        // 默认兜底
        return {
            scene: 'Unknown',
            data: { url: path }
        };
    });

    return { currentContext };
}