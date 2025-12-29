// src/composables/context/useDeviceAi.ts
import { watch } from 'vue';
import { useAiContext } from '@/composables/useAiContext';
import { fetchDevices as fetchDevicesApi } from '@/api/modules/device';
import { buildDeviceListParams } from '@/composables/useDeviceList';
import { generateAiSnapshot } from '@/utils/aiUtils';
import type { DeviceListFilters } from '@/types';

/**
 * 专门负责为 DeviceList 页面注入 AI 上下文
 * @param dependencies 传入页面现有的状态（为了保持响应性）
 */
export function useDeviceListAi(dependencies: {
    filters: DeviceListFilters;
    pagination: { total: number };
    summary: any; // 传入 Summary 对象的引用
    dataCenterMap: Record<string, string>;
}) {
    const { setPageContext } = useAiContext();
    const { filters, pagination, summary, dataCenterMap } = dependencies;

    // 定义核心的数据获取器
    const aiContextGetter = async () => {
        // 1. 影子请求：获取更全的数据 (Limit 100)
        // 这一步是自动的，不管 Device 对象里加了什么属性，fetchDevicesApi 返回什么就是什么
        let shadowList: any[] = [];
        try {
            const shadowParams = buildDeviceListParams(filters, { _page: 1, _limit: 100 });
            const res: any = await fetchDevicesApi(shadowParams);

            if (Array.isArray(res)) shadowList = res;
            else if (res?.items) shadowList = res.items;
        } catch (e) {
            console.warn('AI Shadow Fetch Failed', e);
        }

        // 2. 使用通用工具生成快照
        // ✅ 核心优化：这里不再硬编码 `ID:${d.id}...`
        // 它会自动把 shadowList 里所有的字段都拼进去 (如 sn, ipv4, firmware...)
        const snapshot = generateAiSnapshot(shadowList, {
            // 如果有些字段完全没用且占地方（比如 rawData），可以在这里排除
            excludeKeys: ['rawData', 'secretKey', 'token']
        });

        // 3. 自动聚合页面的所有关联信息
        return {
            scene: 'DeviceListManagement',
            description: 'User is browsing the device asset list.',

            // 宏观统计 (自动解包 summary)
            overview: {
                totalCount: pagination.total,
                onlineStatus: {
                    online: summary.value?.online || 0,
                    offline: summary.value?.offline || 0,
                },
                currentFilter: {
                    ...filters,
                    regionName: filters.dataCenter ? dataCenterMap[filters.dataCenter] : 'Global'
                }
            },

            // 数据视野
            dataScope: {
                visibleCount: shadowList.length,
                note: 'This is a snapshot of the top 100 items matching current filters.'
            },

            // 快照文本
            deviceListSnapshot: snapshot
        };
    };

    // 注册到 AI 上下文
    // 我们可以选择在 filters 变化时自动刷新，或者只在 AI 被唤起时懒加载 (Getter 模式就是懒加载)
    setPageContext(aiContextGetter);

    // 如果需要在 filters 变化时主动通知 AI (可选，视交互需求而定)
    // watch(() => filters, () => { ... }, { deep: true });
}