// src/ai/strategies/useDeviceAi.ts
import { watch } from 'vue';
import { useAiContext } from '../core/useAiContext';
import { generateAiSnapshot } from '../utils/promptUtils';
import { fetchDevices as fetchDevicesApi } from '@/api/modules/device';
import { buildDeviceListParams } from '@/composables/useDeviceList';
import type { DeviceListFilters } from '@/types';

/**
 * 专门负责为 DeviceList 页面注入 AI 上下文
 * @param dependencies 传入页面现有的状态（为了保持响应性）
 */
export function useDeviceListAi(dependencies: {
    filters: DeviceListFilters;
    pagination: { total: number };
    summary: any; // 传入 Summary 对象的引用 (Ref)
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
            // 使用 buildDeviceListParams 确保过滤条件与界面一致
            const shadowParams = buildDeviceListParams(filters, { _page: 1, _limit: 100 });
            const res: any = await fetchDevicesApi(shadowParams);

            if (Array.isArray(res)) shadowList = res;
            else if (res?.items) shadowList = res.items;
        } catch (e) {
            console.warn('AI Shadow Fetch Failed', e);
        }

        // 2. 使用通用工具生成快照
        const snapshot = generateAiSnapshot(shadowList, {
            // 排除敏感或无用字段，节省 token
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
    // 当 AI 助手被唤起时，它会调用这个 getter 获取最新数据
    setPageContext(aiContextGetter);

    // 如果需要在 filters 变化时主动通知 AI (可选)
    // watch(() => filters, () => { ... }, { deep: true });
}